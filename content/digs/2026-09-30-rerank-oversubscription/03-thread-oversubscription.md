---
title: 线程超订阅与 reranker 治理
date: 2026-09-30
order: 3
description: p95 长尾的指标指纹、reranker 模型懒加载的 asyncio.Lock 竞态、专用有界线程池逐词拆解，以及「池型 semaphore」——限请求数与限资源并发数是两把不同的尺子。
tags: ["并发", "线程池", "reranker"]
---

## Q1 · 第3轮 · 初始

二：本项目 p50 从 109→70s 的同时 p95 从 192→90s（-53%），p95 降幅大于 p50，说明修复消灭的是长尾（超订阅把单请求放大到 100s+ 的那批）这个不是将reranker移到线程池执行才优化的程度吗？

## A1 · 第3轮

# 二、p95 的大幅改善是不是“移到线程池”那一刀的功劳？

**你说得完全对**——先明确肯定。8-21→8-28 复验的改善（p50 109→70s，p95 192→90s）主要就是 `run_in_executor` 移出事件循环这一刀带来的。我上一轮说“说明修复消灭的是长尾”，想表达的正是这个因果，但没把**为什么这一刀主要砍在 p95 上**讲透。补上：

## 2.1 修复前：事件循环阻塞制造的是“排队长尾”

旧代码 `predict()` 同步跑在事件循环里，意味着 predict 的 2-3 秒内**整个服务的事件循环是冻结的**——不只是这个请求慢，是所有请求的事都停了：

```
旧：10 个请求到达，事件循环被串行冻结
r1:[predict 2.5s][embed][milvus]      → 总耗时 25s
r2:      [等r1的predict完][predict]   → 在"队列"里白等 2.5s
r3:            [等][predict]          → 白等 5s
...
r10:                        [等][...]  → 白等 ~22s
                ↑ 排队时间随到达顺序线性累积
                  → 最倒霉的请求 = p95/p99 的样本（192s 那批）
```

排队时间 = 前面所有人的执行时间之和，**线性累积，落在长尾上**。这就是为什么旧基线 p95(192s) 是 p50(109s) 的 1.76 倍——形态上“长尾极端拉扯”。

## 2.2 修复后：两层问题的“指标指纹”不同

```
新：事件循环不再冻结，请求真正并行进 executor
r1..r10 同时在途 → 没有排队长尾 → p95 坍缩到 90s
但每个请求的 predict 在超订阅下从 2-3s 膨胀到 ~62s
→ p50 和 p95 "一起高、差距小"（70 vs 90，比值 1.28）
```

**这就是可迁移的诊断心法——用 p50/p95 的比值形状区分瓶颈类型**：

| 瓶颈类型 | 机制 | 指标指纹 |
|---|---|---|
| **阻塞/排队型**（锁竞争、事件循环阻塞、线程池打满） | 后到者等先行者，等待时间累积 | **p95/p50 比值大**（长尾极端） |
| **资源型**（超订阅、CPU 饱和、容量不足） | 每个请求均匀变慢 | **p50 和 p95 同步位移**，比值正常 |

本项目的时间线完美演示了两阶段的切换：基线（阻塞型指纹，192/109=1.76）→ 移出事件循环后（转为资源型指纹，90/70=1.28）→ A/B 实验把资源型瓶颈量化到 86% → Phase 0 有界线程池治理掉超订阅（p50 70→19.7s）。**面试讲这条“指标形态演化链”，比报数字高一个层级。**

---

## Q2 · 第3轮 · 追问

怎么加lock防并发静态
专用有界线程池是啥意思？就是单独搞一个线程池有线程数限制？

## A2 · 第3轮

## 4.5 asyncio.Lock 防并发懒加载竞态——逐行讲

**竞态现场还原**（不用锁会发生什么）：

```
t0: 请求 A 和请求 B 几乎同时到达（都没触发过模型加载）
    A: if self._model is not None? → None → 开始加载
    B:         if self._model is not None? → None → 也开始加载
    （两边同时跑 CrossEncoder(model_name)——各 5-8s、各占数百 MB 内存）
t7s: A 加载完赋值 self._model = modelA
t8s: B 也加载完赋值 self._model = modelB   ← A 的那份成孤儿内存
后果：启动后第一批并发请求触发 N 份重复加载（内存浪费 + 加载期间
     事件循环后面的排队 + 竞态写同一字段）
```

**修复代码**（`reranker.py` 现行，double-checked locking 模式）：

```208:222:backend/services/reranker.py
    async def _ensure_model_loaded(self):
        if self._model is not None:
            return  # 检查①：无锁快速路径（模型已加载的常态，零开销）

        lock = self._get_load_lock()
        async with lock:
            # double-check：拿到锁后再检查一次
            if self._model is not None:   # 检查②：等锁期间别人可能已加载完
                return
            from sentence_transformers import CrossEncoder
            loop = asyncio.get_running_loop()
            self._model = await loop.run_in_executor(None, CrossEncoder, self._model_name)
```

**三次检查各自的角色**（这是理解的关键，不是模板背诵）：
- 检查①（锁外）：90%+ 的调用发生在模型已加载后，走这条零开销快路径——锁是有成本的，常态路径不该付；
- 检查②（锁内）：**必须有**——A 加载完释放锁，B 才拿到锁。没有这一查，B 会无视 A 的成果再加载一遍。等锁的代价换来“至多加载一次”的保证。

**业界映射**：这就是 Java 单例的 double-checked locking、Go 的 `sync.Once` 在 asyncio 世界的对应物。区别：asyncio.Lock 防的是**协程级竞态**（单线程内协程在 await 点让出导致的交错），比线程级竞态温和——但 `run_in_executor` 把加载放进了线程，所以实际上协程锁+线程执行的组合也在防真实线程竞态。还有一个细节：代码里 `_load_lock` 是延迟创建的（`_get_load_lock()`），因为 `asyncio.Lock()` 在旧版本 Python 中要求事件循环已存在，模块级直接创建会报错。

## 4.6 专用有界线程池——你猜对了，但每个词都还有一层

你的理解“单独搞一个线程池有线程数限制”是对的骨架。拆开讲两个词各自扛着什么：

**“专用”（dedicated）——解决的是资源隔离问题**：

```
run_in_executor(None, ...) 的 None = 默认线程池（全项目共享）
默认池 max_workers = min(32, CPU+4)   ← 16 核机器上 = 20
共享意味着：rerank 的 5-8s 重 CPU 任务会占住池里的 worker
           → 同一时刻 PG 查询包装、文件上传 to_thread 等"轻任务"排队挨饿
           → 一个组件的负载拖垮所有组件

专用 = rerank 有自己的池（thread_name_prefix="rerank"）
     → rerank 打满只影响 rerank 自己排队
     → 业界名字：Bulkhead 舱壁模式（船舱隔板：一舱进水不沉整船）
     Hystrix 线程池隔离、DBA 按业务拆连接池，都是同一个模式
```

**“有界”（bounded）——解决的是资源总量可推导问题**：

```
无界/默认池：并发上限(20) × torch线程数(12) = 240 线程 ← 超出物理核 20 倍
有界池：    workers(1~4 可调) × torch_threads(8) ≤ 12 物理核 ← 总预算恒成立

"有界"的真正价值不是"有上限"（默认池也有上限），
而是上限被【显式声明且与下层资源联动】：
  RERANK_MAX_CONCURRENCY × RERANK_TORCH_THREADS ≤ 物理核数
这是从"碰巧不炸"到"设计上不可能炸"的区别。
```

配套机制（让“有界”变成可运营的）：两个参数注册进运行时配置，修改后自动触发 `_reset_rerank_pool()` → `shutdown(wait=False)`（在途任务自然跑完，不中断）→ 下次调用按新参数重建池——**调吞吐不用重启服务**，这是当初 A/B 验证（试 concurrency=2/4 观察崩溃边际）的基础设施。

---

## Q3 · 第4轮 · 追问

一：当“任务单元”和“并发资源”不是一对一的时候。比如一个逻辑请求要并发打 3 个 API（embedding + BM25 + Milvus），你想限制的是总在途 HTTP 连接数而不是逻辑请求数——这时共享一个 semaphore 才能限住总量。本项目实际代码里也有真实用例：_get_rerank_executor 的 RERANK_MAX_CONCURRENCY 本质上就是给 rerank 这个临界资源装了个“池型 semaphore”。啥意思？什么逻辑3个API

## A3 · 第4轮

# 一、“1 个逻辑请求并发打 3 个 API”和“池型 semaphore”

## 1.1 先还原：一次搜索在系统内部到底发生了什么

你从搜索页敲一个 query 点回车，是**一个逻辑请求**。但它进到后端后会**扇出**成多个下游调用：

```
用户搜索"部署流程文档"（1 个逻辑请求）
   │
   ├─ 调用① embedding HTTP API   → 把 query 文本变成向量（远程 litellm）
   ├─ 调用② Milvus 向量检索       → 拿向量查 Zilliz
   ├─ 调用③ BM25 关键词打分       → 内存里算（不发出网络请求，但占 CPU）
   └─ 调用④ rerank predict        → BGE 模型 CPU 重计算
   （Agent 工作流里这几路还是 asyncio.gather 并行发的）
```

所以"1 个逻辑请求 → 3~4 个下游调用”不是假设，是这个系统的真实形态。

## 1.2 核心问题：限制“请求数”和限制“资源并发数”是两把不同的尺子

现在把并发加进来，看两种尺子量出来的数字**对不上号**：

```
10 个并发逻辑请求（线程池/信号量都限成 10）：
   → embedding API 同时收到 10 个调用     ← 尺子A量的是 10
   → Milvus 同时收到 10 个查询
   → rerank 同时发生 10 个 predict
   → 下游总并发 = 30~40                   ← 尺子B量的是 30~40
```

两个**错位方向**同时存在：

**错位一：一个任务用多个资源**（上面画的就是）。限了 10 个请求，没限住每个请求扇出的下游总量。

**错位二：一个资源被多种任务用**。拿 embedding API 举例——它不止被“搜索”调用：

```
embedding API 这个资源（litellm 远程，实测 import 并发 3 就 429！）
   ← 搜索路径来调（query 向量化）
   ← 导入路径来调（每个 chunk 向量化，0.6-1.2s/条）
   ← Graph 路径来调（实体描述向量化）
```

Stage 4 报告里的实证：**“并发 3 即触 embedding 429”**。如果搜索路径限自己 10 并发、导入路径限自己 3 并发，两条路径**同时跑**时 embedding 实际承受 13 并发——照样炸。**因为限流装置装在了“各条业务路径”上，而不是装在“资源”上**。

## 1.3 正确做法：把限流贴在资源侧——这就是 semaphore 的用武之地

```
方案：在"调 embedding"这个动作外面包一个全局共享的 semaphore(3)

sem = asyncio.Semaphore(3)          # 全局唯一，谁要调 embedding 都得过它

async def embed(text):
    async with sem:                  # ← 拿不到许可就挂起等待
        return await call_embedding_api(text)

现在：搜索路径、导入路径、Graph 路径，不管各自多少并发，
     同一时刻最多 3 个 embedding 调用在途 —— 429 消失
```

关键句翻译：**“你想限制的是总在途连接数而不是逻辑请求数——共享一个 semaphore 才能限住总量”** = 信号量必须被**所有**会碰这个资源的代码**共享**，装在各路径自己的局部限流器上就限不住总量。

## 1.4 “池型 semaphore”：为什么说 reranker 线程池本质上就是一个信号量

现在看你问的那句话。rerank 这个**临界资源**（12 物理核 CPU + torch predict 的稳定性）面临同样问题：调用 rerank 的路径也不止一条——`api/search.py` 的检索端点调它，Agent 的 `rag_hybrid_search` 工具也调它。治理方案：

```258:259:backend/services/reranker.py
            loop = asyncio.get_running_loop()
            scores = await loop.run_in_executor(_get_rerank_executor(), model.predict, pairs)
```

所有路径都汇进 `_get_rerank_executor()` 返回的**同一个**线程池（`max_workers=RERANK_MAX_CONCURRENCY`）。这个池在功能上等价于一个信号量：

```
等价性对照：

Semaphore(N) 版本                     ThreadPoolExecutor(N) 版本
─────────────────────────            ─────────────────────────
sem.acquire() → 拿到 1 个许可         提交任务 → 占住 1 个 worker
  （拿不到就排队等）                    （没空 worker 就进池的队列等）
执行 predict                          worker 执行 predict
sem.release() → 还回许可              worker 干完自动取下一个任务
─────────────────────────            ─────────────────────────
语义完全同：任意时刻最多 N 个 predict 在跑，多的排队
```

所以“**池型 semaphore**”= 这个并发上限不是用信号量原语实现的，而是用线程池的物理结构实现的——效果一样，还**白送三样东西**：① 常驻 worker 线程（不用每次 acquire 都临时造线程）；② 自带队列（等待者自动排队）；③ 资源隔离（rerank 的排队不挤占共享池，前面讲过的舱壁模式）。

**业界对照**（正好有同名概念，说明这个思想很经典）：Netflix Hystrix（熔断库，Java）做隔离时就明着给了两种模式让你选——**semaphore isolation**（信号量隔离子线程开销小，适合纯内存调用）和 **thread pool isolation**（线程池隔离可超时兜底，适合远程调用）。数据库连接池（`pool_size=20`）的本质也是它：20 个许可 = 20 条连接。**“限制并发访问稀缺资源”这个需求，在工程世界里长得都一样，只是实现载体不同。**

---
