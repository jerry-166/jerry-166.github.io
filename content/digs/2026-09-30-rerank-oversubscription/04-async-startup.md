---
title: 异步化与启动优化
date: 2026-09-30
order: 4
description: lifespan 大事件串联：并发预热、readiness 就绪门、各组件线程池/协程的选型判断规则，以及这条「复发升级」主线为什么适合面试记忆。
tags: ["asyncio", "lifespan", "启动优化"]
---

## Q1 · 第2轮 · 初始

二：在这块儿，我觉得可以关联到之前的 Reranker。这里不是说同步阻塞在事件循环里面了吗？这可能是因为我们以前的代码写得不好，导致在后续修改或压测的过程中出现了错误，我们才去定位并改进修改的。
之前我们也做过其他模块（比如 milvus、模型、Redis 等）的异步化，因为启动时间太长了（都放在 lifespan 里面了）。
这里可以把这部分单独拓展出来。到时候如果他问到了，我也好拓展到这部分去说。（就是给我一个可以将很多大事件串联起来的感觉吧，这样方便我记忆）

## A1 · 第2轮

# 第二块：大事件串联——“异步化”主线（记忆线）

你说得对：reranker 阻塞不是孤立 bug，它是**同一条问题主线在项目三个阶段的复发和升级**。这条线串起来，面试时任何一环被追问都能延展到全线。

## 2.1 时间线全景图

```
【阶段一：启动期异步化】2026-08-18（设计文档 01）
  症状：服务启动要很久才能接请求
  诊断：lifespan 里全是同步阻塞——
    ├─ BM25 语料同步加载（SELECT * 全量入内存）
    ├─ BM25 首次分词：整桶 jieba 全量分词（CPU 密集，阻塞协程）
    ├─ Milvus 构造函数内同步 connect（30s 超时）
    └─ PG 模块级 import 即连接（不可控）
  修复：并发预热（gather + run_in_executor 包裹同步操作）
    + readiness Event 就绪门（未就绪请求带锁等待/503，不是 500）
    + 分词缓存落 PG（TEXT+LZ4，chunk 粒度自动失效）
  ↓ 建立的核心认知①："事件循环上不能有同步阻塞/CPU 密集"
  ↓ 同批顺手给 reranker 模型【加载】加了 asyncio.Lock（防并发懒加载竞态）

【阶段二：检索期阻塞复发】2026-08-21 Stage 4 压测
  症状：并发 p50=109s（单发才 22-25s）
  诊断：CrossEncoder.predict() 同步跑在事件循环里
  ⚡ 关键叙事点：阶段一治理的是"加载阻塞"，predict 是"推理阻塞"——
     同一类问题，换了位置，当时漏了。代码旧注释还写着
     "predict 只读推理、多线程并发安全"——未经验证的假设
  修复：run_in_executor 移出事件循环，乐观预测 p50→10s

【阶段三：复验打脸 → 深挖根因】2026-08-28/29
  症状：p50 只降到 70s，没达预测
  动作：不硬凑数字 → 补 A/B 开关实验 → reranker 占 86%
  根因：移出事件循环只是必要条件；默认线程池并发 × torch 满核线程
        = 120 线程挤 12 核超订阅（+ c10.dll 崩溃证伪并发安全假设）
  ↓ 建立的核心认知②："移出事件循环 ≠ 并发安全，
    线程总预算（workers × torch_threads ≤ 物理核数）才是充分条件"

【阶段四：治理闭环】2026-09-01 Phase 0
  修复：专用有界线程池 + torch 线程预算 + 热调钩子（不重启改并发）
       + aquery() 补齐最后一处同步点（api/search.py:188）
  验证：0 崩溃 / p50 19.7s / 落在预告区间
```

## 2.2 这条主线为什么好记（三个“复发升级”模式）

1. **同一个心智模型被压了三次**：事件循环上不能有同步阻塞——启动期（lifespan 加载）→ 检索期（predict 推理）→ 检索期残留（`milvus_client.query()` 同步 embed+search）。每次都是“验收/压测暴露 → 修复 → 复验 → 又暴露下一处”。
2. **每次修复都比上次深一层**：`run_in_executor 包一层`（阶段一/二）→ 发现默认池本身有问题（阶段三）→ `有界池 + 预算 + 热调`（阶段四）。**从“会异步化”到“懂线程经济学”的升级**。
3. **旧假设被实测证伪是贯穿性戏剧冲突**：“predict 并发安全”的注释 → c10.dll APPCRASH；“聚合缓存”的设计 → 新内容检索不到的 bug。面试时“我证伪了自己/前人写下的假设”比“我修了个 bug”有说服力得多。

## 2.3 面试串联话术（30 秒版）

> “这个项目的性能问题有一条主线：**异步化治理是分阶段递进的**。最早是启动优化——lifespan 里 BM25 全量加载、Milvus 同步连接，我把它们并发预热化、加分词缓存，当时建立了‘事件循环不能碰同步阻塞’的认知。但 Stage 4 压测证明这个认知只落了一半：模型**加载**异步化了，模型**推理**（predict）还在事件循环里同步跑，并发 p50 直接 109s。我修完复验发现只降到 70s——没达预测，我没有硬凑数字，而是补了个 A/B 开关实验，量化出 reranker 占 p50 的 86%，再往下挖才找到真正根因：torch 线程超订阅。最终方案是有界线程池加线程预算。回头看，**这类问题靠一次修复断不了根，要靠每轮压测复验不断暴露**——这也是我后来坚持所有性能修复都要有 before/after 数据的原因。"

---

## Q2 · 第3轮 · 追问

四：修复：并发预热（gather + run_in_executor 包裹同步操作）

    + readiness Event 就绪门（未就绪请求带锁等待/503，不是 500）

    + 分词缓存落 PG（TEXT+LZ4，chunk 粒度自动失效）

  ↓ 建立的核心认知①："事件循环上不能有同步阻塞/CPU 密集"

  ↓ 同批顺手给 reranker 模型【加载】加了 asyncio.Lock（防并发懒加载竞态）
这些具体到组件，如redis，pg，reranker，model各个用了什么，还是都用了线程池/gather协程并发？readiness是干嘛的解决什么问题，

## A2 · 第3轮

# 四、启动优化组件级全景（每个组件用了什么 + 三个机制逐一拆解）

## 4.1 总原则：一条判断规则决定所有组件的方案

```
这个依赖是同步库还是异步原生库？
  ├─ 异步原生（httpx.AsyncClient / asyncpg / redis.asyncio）
  │    → 直接 await，用 asyncio.gather 编排并发
  └─ 同步库（pymilvus / psycopg / sentence-transformers / jieba）
       → loop.run_in_executor(executor, 同步函数) 包进线程
            （executor=None 是共享默认池；重资源任务给专用池——reranker）
```

`gather` 和 `run_in_executor` 不是二选一，是**不同层的工具**：executor 解决“同步代码怎么跑不挡路”，gather 解决“多个预热任务怎么同时跑”。经常组合出现。

## 4.2 组件对照表（全部来自 `app.py` lifespan 实际代码）

| 组件 | 库是同步还是异步 | 启动期实际方案 | 代码证据 |
|---|---|---|---|
| **PG** | psycopg 同步 | `_DbProxy` 惰性代理：模块级 `db = _DbProxy()` 不连接，首次真正访问属性才 `_ensure()` 建连接+建表。**没预热**（它是前提，谁都绕不开，惰性即可） | `database.py:1692` |
| **Milvus** | pymilvus 同步 | **预热**：`run_in_executor(None, client.connect)` 后台连 | `app.py:37` |
| **BM25 语料** | psycopg 同步读 | **预热**：`run_in_executor(None, client.load_from_database)` 全量语料入内存 | `app.py:51` |
| **Reranker 模型** | sentence-transformers 同步（加载 5-8s） | **预热**：`await reranker._ensure_model_loaded()`（内部 run_in_executor 包 CrossEncoder 构造 + asyncio.Lock 防竞态） | `app.py:109-113` |
| **3 个 Agent** | registry 构建=同步重 imports | **预热**：`run_in_executor(None, _preheat_agents_sync)` | `app.py:102` |
| **Tracing（Phoenix/Langfuse）** | 同步初始化含网络请求 | 后台任务：`run_in_executor(None, setup_tracing)` | `app.py:171` |
| **编排层** | — | `asyncio.gather(milvus, search, agents)` 三路并发预热 | `app.py:195-199` |
| **Redis** | redis-py **同步** | **不预热，懒探测+降级**：首次用时 `ping()`（socket_timeout=2s），失败→降级纯内存模式继续跑 | `cache.py:74-82` |
| **LLM/Embedding 客户端** | HTTP 客户端 | **不预热**：懒连接，首次请求才建 TCP/TLS |

**为什么有的预热、有的不预热**（决策规则，面试可讲）：

```
请求主路径的致命依赖（Milvus/BM25/模型）→ 预热 + readiness 门
  ↓ 为什么：没就绪时请求只能失败，预热把失败窗口消灭在启动期
有降级路径的可选依赖（Redis→纯内存、tracing→none）→ 懒探测 + 降级
  ↓ 为什么：它挂了服务照样活，预热反而拖慢启动，失败留给运行时降级
前提性依赖（PG）→ 惰性
  ↓ 为什么：任何路径第一步都会碰它，专门预热没有收益
```

Redis 那条值得单独记：它连线程池都没用——`socket_timeout=2` 的短超时同步调用，最坏 2 秒卡一次，之后 `_redis_ok=False` 缓存住“不可用”状态不再重试，直到异常时重置。**这是“用超时上限换复杂度”的极简方案**，对可选依赖足够。

## 4.3 readiness 是干嘛的——解决“服务活了但零件没装好”

**问题场景还原**：uvicorn 监听端口只要 ~2s，但 Milvus 连接（远程 Zilliz）+ BM25 语料加载要十几秒。这中间来了请求：

```
无 readiness 门：请求进来 → milvus_client 还没 connect
  → ConnectionError → 返回 500（Internal Server Error）
  → 用户看到"服务器出错了"——但其实服务器没出错，是没"装好"
```

**方案**：每个组件一个就绪信号，请求路径在门口等它：

```
lifespan:
  readiness.set_pending('milvus')  ──┐
  readiness.set_pending('search')  ──┼─ 三路后台预热（gather 并发）
  readiness.set_pending('agents')  ──┘
        │ 每路完成: readiness.mark('milvus')           ← 成功
        │ 或失败:   readiness.mark('milvus', '原因')    ← 失败也 mark（带错误）

请求路径（每个依赖组件的入口）:
  await _await_ready(timeout=60)
    ├─ 已就绪 → Event.is_set() 快路径，零开销（常态）
    ├─ 未就绪 → 挂起等待（最多 60s），等预热完成自动放行
    └─ 初始化失败 → 抛出 → 返回 503 + "Milvus 连接失败（...）"具体原因
```

对外还暴露 `/healthz`：全就绪返回 200，否则 503 + 各组件状态快照（`app.py:330-337`）。

**两个业界映射点**（第四块方法论在具体组件上的实例）：

1. **503 vs 500 的语义选择是有讲究的**：503 Service Unavailable = “我活着，但暂时不能服务，请稍后重试”（负载均衡/客户端会退避重试，不会告警“服务挂了”）；500 = “我出 bug 了”。启动期/预热期返回 500 是语义误用。
2. **`/healthz` 这个名字和 k8s readinessProbe 是同构的**：k8s 里 liveness probe 回答“该重启我吗”，readiness probe 回答“该给我导流量吗”。我们实现的就是应用层 readiness——如果这个服务上 k8s，`/healthz` 直接可以挂成 readinessProbe 的探测端点。自研方案踩在了业界标准语义上，不是巧合，是“启动可服务性”这个问题的本质结构决定的。
