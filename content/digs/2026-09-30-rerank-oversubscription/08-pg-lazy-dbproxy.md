---
title: PG 惰性初始化与 _DbProxy 修复
date: 2026-09-30
order: 8
description: PG 为什么惰性初始化的预热收益公式、_ensure 声明了锁却没用锁的读代码缝隙、BUG-026 双检锁修复的完整落地与「值不值得修」论证。
tags: ["PostgreSQL", "并发缺陷", "double-checked locking"]
---

## Q1 · 第4轮 · 初始

二：前提性依赖（PG）→ 惰性

  ↓ 为什么：任何路径第一步都会碰它，专门预热没有收益  正是因为它是任何路径的前提，不是应该先预热它吗

## A1 · 第4轮

# 二、PG 为什么“惰性”——你的直觉其实是对的

先直接肯定：**你质疑得对，而且设计文档和你想的一样**。我上一轮表格里那个“惰性”的标签写得容易误导，这里把三层事实掰开。

## 2.1 设计文档的方案：PG 就是“最先、同步”初始化

`2026-08-18-01-startup-optimization-design.md` 原文：

> 启动路径（同步）：1. PG 连接 + create_tables()（……仍同步——**它是其他一切的前提**）

注意理由的后半句：BM25 语料加载（后台预热任务）**第一条 SQL 就要读 PG**，审计 flush 也要写 PG。如果 PG 自己也扔进后台预热组，就出现“后台任务 A 依赖后台任务 B 先完成”的依赖链——**gather 的前提是各路相互独立**，有依赖就不能并发，先后顺序必须显式排。

## 2.2 实际实现：更放松，用惰性代理达到了同样效果

看 `database.py` 里的真实代码和注释：

```1673:1689:backend/services/database.py
# 圈6：Database() 构造含同步 PG 连接 + 建表（实测 ~0.4s），延迟到首次真正使用时初始化，
# 不阻塞 import/启动。所有调用方均只使用 `db.<method>()` 形式，代理对行为等价。
class _DbProxy:
    """Database 的懒加载代理：首次属性访问时才构建真实实例。"""
    __slots__ = ('_real', '_lock')

    def __init__(self):
        self._real = None

    def _ensure(self):
        if self._real is None:
            self._real = Database()
        return self._real

    def __getattr__(self, name):
        return getattr(self._ensure(), name)

db = _DbProxy()
```

它解决的是另一个问题：**旧代码在模块 import 阶段就连接 PG**（`db = Database()` 写在模块顶层）——uvicorn 还没进 lifespan、连日志都没配好，import 链就开始卡 0.4s，且完全不可控。代理把这个成本从“import 时”挪到“第一次真用它时”——通常是 BM25 预热任务发出的第一条查询，或审计的第一次 flush。

所以准确的说法是：**PG 不是“不预热”，而是“不编排”**——谁第一个需要它，谁顺手触发它（付 0.4s），之后所有人复用。

## 2.3 为什么“不编排”反而是对的：预热收益公式

```
预热的收益 = 掩盖掉的等待时间 = f(慢, 独立)

  Milvus 连接：  慢（远程 Zilliz，秒级）+ 独立（没人等它）    → 收益大，进 gather
  BM25 加载：    慢（全量语料读 PG + 建 memory 结构）+ 独立   → 收益大，进 gather
  PG 初始化：    不慢（本地 socket + 幂等 DDL，实测 0.4s）
                + 不独立（所有人排在它后面，没东西可跟它并行） → 收益≈0，不编排
```

一句话原则：**预热编排的是“慢且独立”的等待；又快又根本的依赖，让依赖链自己带它起来**。你的直觉“应该先初始化它”在**顺序**上完全正确（它事实上就是最早完成的），只是不需要为它专门安排一个“预热任务”。

## 2.4 顺带一个批判性观察（读代码的态度示例）

注意 `__slots__ = ('_real', '_lock')` 声明了 `_lock`，但 `_ensure()` **根本没用锁**——两个线程同时首次触碰 `db`（比如 BM25 预热线程和审计 flush 线程同刻启动）会各自构造一个 `Database()`，后写的覆盖先写的，先建的连接成孤儿。0.4s 的窗口 + 概率极低 + 后果只是浪费一条连接，所以从没炸过。但**这正是一个 double-checked locking 该在而没在的地方**（对比 reranker 的 `_ensure_model_loaded` 做了完整加锁）。读代码时能看出这种“声明了却没用”的缝隙，是比“看懂了主逻辑”更深一层的功力——面试聊到任何代码细节时带上这种观察，可信度直接拉满。

---

## Q2 · 第6轮 · 追问

2.4 顺带一个批判性观察（读代码的态度示例）

注意 __slots__ = ('_real', '_lock') 声明了 _lock，但 _ensure() 根本没用锁——两个线程同时首次触碰 db（比如 BM25 预热线程和审计 flush 线程同刻启动）会各自构造一个 Database()，后写的覆盖先写的，先建的连接成孤儿。0.4s 的窗口 + 概率极低 + 后果只是浪费一条连接，所以从没炸过。但这正是一个 double-checked locking 该在而没在的地方（对比 reranker 的 _ensure_model_loaded 做了完整加锁）。读代码时能看出这种“声明了却没用”的缝隙，是比“看懂了主逻辑”更深一层的功力。这个需要修复吧

## A2 · 第6轮

BUG-026 已修复并关闭（`database.py` 双检锁，无 lint 错误）。**请你重启后端服务验证一次**：正常启动 + 任意一次搜索/登录走通即可（修复只在“首次并发触碰 db”的窗口生效，日常路径行为不变）。验证方法如果想要更狠的：起服务后立刻并发打两个依赖 db 的请求（如同时 `/healthz` 和一次搜索），日志里应只出现一次连接建立。

# 三、`_DbProxy` 修复——你判断对了，而且实际比我说得还糟一点

## 3.1 修复前先补一个更狠的事实

上一轮我说“声明了 _lock 但没用”——**实际状况还要再低一档**：

```python
__slots__ = ('_real', '_lock')     # 声明了 _lock

def __init__(self):
    self._real = None              # ← 但从来没给 _lock 赋值！
```

而且 `database.py` 顶部**连 `import threading` 都没有**。这意味着：这个锁不是“忘了用”，是**根本不存在**——谁要是哪天顺手写 `with self._lock:` 会直接吃 `AttributeError`（slots 属性未赋值即访问会抛）。一个连“可用”都没达到的占位声明，比没有锁更误导：读者扫一眼 `__slots__` 会以为这里有保护。这正是 BUG-026 记录里“半成品锁比没有锁更危险”的由来。

## 3.2 修复后的代码（已落盘）

```1673:1696:backend/services/database.py
# 全局数据库实例
# 圈6：Database() 构造含同步 PG 连接 + 建表（实测 ~0.4s），延迟到首次真正使用时初始化，
# 不阻塞 import/启动。所有调用方均只使用 `db.<method>()` 形式，代理对行为等价。
# BUG-026 修复：_ensure 加 double-checked locking——BM25 预热 / 审计 flush / 缓存 stats
# 等 worker 线程可能在首触窗口（~0.4s）内并发，无锁会各自构建 Database()，
# 后写覆盖先写、先建连接成孤儿。threading.Lock（非 asyncio.Lock）因调用方含线程上下文。
class _DbProxy:
    """Database 的懒加载代理：首次属性访问时才构建真实实例（双检锁防并发重复构建）。"""
    __slots__ = ('_real', '_lock')

    def __init__(self):
        self._real = None
        self._lock = threading.Lock()

    def _ensure(self):
        if self._real is None:          # 快路径：已构建，无锁直返（常态）
            with self._lock:
                if self._real is None:  # double-check：等锁期间可能已被其他线程构建
                    self._real = Database()
        return self._real

    def __getattr__(self, name):
        return getattr(self._ensure(), name)
```

三个设计决策的“为什么”（每个都对应前几轮讲过的概念，正好是复习）：

1. **为什么 `threading.Lock` 而不是 `asyncio.Lock`**——看**调用上下文**：`db` 会被 BM25 预热（`run_in_executor` 的 worker 线程）、审计 flush 线程、缓存 stats 线程直接触碰，这些是**真线程**；asyncio.Lock 只在事件循环协程间有效，跨线程用它反而是 bug。对比：reranker 的 `_ensure_model_loaded` 用 `asyncio.Lock`，因为它的调用点全在协程里。**两个锁类型不同不是不一致，是“按调用者选锁”各选各对的**——这本身是个面试点。
2. **为什么快路径不加锁**——reset-not-mutate 家族的同款安全论证：`_real` 赋值后只被读、永不被原地改（重建时也是先建新再换引用），且 CPython 引用赋值在 GIL 下原子——读者要么拿旧实例（完整存活）要么拿新实例，不存在中间态。常态调用（每次 `db.xxx()` 都要过 `_ensure`）付的只有一次 `is None` 判断，纳秒级。
3. **为什么 double-check 而不是裸锁**——99.99% 的调用发生在已构建之后，若每次都进锁，等于给全项目所有 DB 调用加一个全局串行点（哪怕只锁纳秒，也是无谓争用热点）。锁只保护那 0.4s 的首触窗口。

## 3.3 值不值得修的完整论证（面试聊“缺陷修复优先级”的模板）

```
代价：3 行代码，风险趋近零（锁只在首触窗口被争用，之后永远走快路径）
收益：消灭一条真实的连接泄漏路径（每次触发泄一条 PG 连接，长期运行的服务里
      连接槽是有数的）+ 消灭重复建表开销
概率：低但非零，且窗口常驻（每次冷启动都重新暴露一次；多线程入口越多越高）
结论：修复成本 << 期望损失 → 修，且顺手把"死声明"这个误导源清掉
```

反面对照（什么时候**不**修）：如果重复构建的代价是“两个几十字节的纯内存对象、无外部资源”，修它就是过度工程——锁的复杂度本身也是成本。**修不修的唯一判据是“重复构建有没有不可回收的副作用”**（连接 = 有；纯对象 = 无）。

## 3.4 验证方法（请务必跑一次）

1. **冒烟**：重启后端（`start_all.ps1` 或直接 uvicorn），登录 + 搜一次——行为应与修复前完全一致（快路径逻辑没变）。
2. **针对性验证并发首触**（想较真的话）：
   ```python
   # backend 目录下 quick_check.py，跑完删掉
   import threading
   from services.database import db, _DbProxy
   constructed = []
   orig = _DbProxy._ensure  # 计数不侵入：观察日志里 "数据库连接" 只出现一次更简单
   
   barrier = threading.Barrier(8)
   def touch():
       barrier.wait()            # 8 线程对齐起跑，最大化撞进首触窗口
       db.fetchone("SELECT 1")
   ts = [threading.Thread(target=touch) for _ in range(8)]
   [t.start() for t in ts]; [t.join() for t in ts]
   print("ok, db id:", id(db._real))   # 全线程共享同一个实例即通过
   ```
   通过标准：日志里 PG 连接建立只出现**一次**；`id(db._real)` 全程同一个。
3. 注意一个边界：这个测试对**修复前**的代码不一定每次都能复现出双构建（竞态本来就是概率性的）——所以“修复前复现失败”不等于“缺陷不存在”，这也是为什么它七年...哦不，为什么它潜伏了这么多轮没炸（窗口小 + 后果温和 + create_tables 幂等兜住了最坏情况）。

---

## 三块内容的收束

```
一（双桶）──→ 写按操作者路由、读按 KB 收齐、重启归化：多租户索引的
              "write-locality vs read-coherence"权衡，PG 是唯一权威
二（PG+LRU）─→ 缓存引擎跟对象性质走：数据进 PG/Redis，计算对象留进程内；
              真要共享计算 → 换引擎（ES），项目里已有这个逃生门
三（_DbProxy）→ 半成品锁比没锁更危险；锁按调用上下文选类型；
              修复优先级判据 = 重复构建有无不可回收副作用
```

顺带说一句：这次是你把“批判性观察”推进成了实际修复——**“看出缝隙”到“判断值不值得修”到“动手修对锁”**，这三步连起来正是面试里“讲一个你 code review 修复的并发缺陷”的完整故事素材（BUG-026 的 frontmatter 就是现成的 STAR 骨架：现象→根因→修复→教训全齐）。要不要下轮把它包装成 30 秒面试话术？或者继续拆简历下一条。
