---
title: 分词缓存 · PG 两层结构
date: 2026-09-30
order: 6
description: 分词缓存落 PG 的完整演化史、LZ4/TOAST/N+1 概念地图、内存与 PG 两层的读写路径逐步走查、增删双写的顺序与事务、置脏粒度从桶到 chunk 的演化。
tags: ["缓存", "PostgreSQL", "N+1"]
---

## Q1 · 第3轮 · 初始

分词缓存pg是啥意思，这块是干嘛了，经历过什么变化（每次分词->...->存分词+内存加载），

## A1 · 第3轮

## 4.4 分词缓存落 PG——完整演化史

你要的“每次分词 → … → 存分词+内存加载”演化线，一共三阶段：

```
【阶段 0：裸奔】
  检索某桶 → 该桶 BM25 模型不在内存 → 现场对整桶 chunk 做 jieba 分词
  （万级 chunk = 秒~十秒级 CPU 密集，阻塞请求协程）
  → 分词结果只存在于内存里的 BM25 模型中
  问题①：重启全丢，每次重启后第一次搜索都要重付全量分词成本
  问题②：一个 chunk 变了 → 只能整桶重分词（失效粒度太粗）
  问题③：多实例部署时各进程各自重算（不共享）

【阶段 1：分词结果持久化到 PG】（设计文档 01-C，已落地）
  document_chunk 表加一列：
    tokenized TEXT   ← 存 " ".join(tokens) 空格连接的分词串
    ALTER ... SET COMPRESSION lz4   ← PG 14+ 的 TOAST 列压缩

  读路径（建桶时）：
    一次 IN 批量查询取回所有已分词 chunk（防 N+1）
    → 命中的直接 text.split(' ') 还原 token 列表（毫秒级）
    → 没命中的（NULL）才现场 jieba 分词 → 批量写回 PG

  写路径（自动失效）：
    INSERT ... ON CONFLICT DO UPDATE SET ..., tokenized = NULL
    → 新增/修改 chunk 时分词缓存自动置脏，下次读到 NULL 重分这一个

  效果：
    重启后首次建桶：秒~十秒级 → 毫秒级（读缓存+纯内存统计构建）
    chunk 变更：整桶重分词 → 只重分那 1 条
```

**三个设计细节的“为什么”**（每个都可能被追问）：

1. **为什么用 TEXT 空格连接而不用 JSONB 数组**：JSONB 每个 token 要带引号逗号（`["部署","文档"]` 的 `"`,`,` 是纯开销），叠加 jieba `cut_for_search` 搜索模式本身产生重复词条，实测存储 = 原文的 2~2.5 倍。TEXT+LZ4 压缩后 ≈ 原文的 0.8~1.2 倍。空格分隔安全的前提：中文分词不含空格、英文 token 自身无空格——**join/split 是无损可逆的**。
2. **三态语义**（NULL/空串/非空）为什么需要空串这一态：防御性的——如果一个 chunk 内容真分不出任何 token，用 `''` 表示“分过了但为空”，区别于 NULL“从没分过”。不加这个态，空结果会被反复重分。
3. **为什么不用 Redis/内存缓存而是 PG 列**：分词缓存和 chunk 原文是**同一个生命周期**（chunk 删了缓存也该消失、chunk 改了缓存必须失效）——放进同一行的同一事务里，就**没有“缓存与数据不一致”这个问题的存在空间**。旁路缓存（Redis）则需要额外维护失效逻辑，写路径漏一处就出脏数据。这叫**单一事实源（Single Source of Truth）设计**。

## Q2 · 第4轮 · 追问

三：lz4是什么？还有什么？为什么选这个？toast列压缩是？
  读路径（建桶时）：

    一次 IN 批量查询取回所有已分词 chunk（防 N+1） N+1?

    → 命中的直接 text.split(' ') 还原 token 列表（毫秒级）

    → 没命中的（NULL）才现场 jieba 分词 → 批量写回 PG  现场分什么词？内存里存的chunk？还是说没有切分或持久化的chunk


  写路径（自动失效）：

    INSERT ... ON CONFLICT DO UPDATE SET ..., tokenized = NULL

    → 新增/修改 chunk 时分词缓存自动置脏，下次读到 NULL 重分这一个 新增chunk，什么缓存置脏？内存？为什么新增会置脏？

 
  效果：

    重启后首次建桶：秒~十秒级 → 毫秒级（读缓存+纯内存统计构建）从pg中读加载到内存中建桶？

    chunk 变更：整桶重分词 → 只重分那 1 条  从桶变到了chunk级别对吧？
这几个部分都是啥意思呀？我看这个好像应该有两层吧，对吧？一层是内存里面的，一层是 PostgreSQL 里面的，是吗？chunk变更我们没有这个场景吧？我觉得这个怎么说怪怪的，虽然说可能是对于过去的数据进行更新是吧，告诉我模型是什么？

## A2 · 第4轮

# 三、压缩、TOAST、N+1、两层缓存——全图拆解

你最后那个判断是对的：**这里确实是两层结构**。先把你问的四个词全部讲掉，再拼成全景。

## 3.1 LZ4 是什么？压缩算法地图

**LZ4**：一种 LZ 系无损压缩算法（LZ77 家族：找“前面出现过的重复串”用引用替代）。它的定位是**用压缩率换速度**：解压速度 GB/s 级（几乎免费），压缩也极快，代价是压缩率中等。

放在地图上看（压缩率 vs 速度是跷跷板）：

| 算法 | 压缩率 | 压/解速度 | 在哪常见 |
|---|---|---|---|
| LZ4 | 中 | **解压 GB/s，最快** | PG TOAST（PG14+）、Kafka 压缩选项、Linux 内核 zram |
| Snappy | 中 | 极快（LZ4 同级竞品，Google 出品） | LevelDB/RocksDB、Protobuf 生态 |
| pglz | 中 | 慢于 LZ4，压得多一点 | **PG 内置默认**（TOAST 不配置就用它） |
| zlib/gzip | 较高 | 慢一个量级 | gzip 文件、HTTP 旧压缩 |
| zstd | **高**（可调级别） | 快（介于 LZ4 和 zlib 之间） | Facebook 出品，新基建首选（S3 透明压缩、ClickHouse、内核模块） |
| Brotli | 高（文本尤佳） | 慢 | HTTP 静态资源（预压缩字典） |

**为什么选 LZ4（而不用默认 pglz、不上 zstd）**：

1. `tokenized` 列在**读路径上**——每次建桶、每次桶重建都要读它。解压速度 GB/s 意味着解压成本被 IO 完全掩盖；pglz 解压慢一截，会在读路径上留痕。
2. 分词串冗余度极高（中文常用词反复出现、jieba 搜索模式本身产生重复词条），LZ4 这个“压缩率中等”的算法也能压掉 50-60%——够了。
3. zstd 压缩率更高，但 **PG 的 TOAST 核心只内置 pglz 和 lz4 两种**（zstd 没进核心）——想用 zstd 得应用层自己压成 bytea 存，那会丢掉“列还是普通 TEXT”这个透明性（见下）。

## 3.2 TOAST 列压缩是什么？

从存储原理讲起，一句话就懂：

```
PG 的存储单位是"页"（page）= 固定 8KB。
一行数据的所有字段必须想办法塞进页里（行的最大尺寸 ~2GB 理论上限，
但超过 ~2KB 的字段就放不进页内了）。

TOAST = The Oversized-Attribute Storage Technique（超大属性存储技术）
  就是 PG 处理"字段值大于 ~2KB"的内置机制，自动做两件事：
    ① 尝试压缩（用该列配置的算法）
    ② 压完还塞不下 → 把值切成小块，挪到旁边一张"边车表"（TOAST 表）存
  查询 SELECT 该列时：自动从边车表拼回 + 解压 —— 对 SQL 完全透明
```

所以 `ALTER TABLE document_chunk ALTER COLUMN tokenized SET COMPRESSION lz4` 这句话的准确含义是：**“告诉 PG：将来 TOAST 处理这一列时，用 lz4 而不是默认 pglz”**。它不是我们实现了什么压缩——是选了个内置开关。应用代码里这列依然是普通 TEXT，`split(' ')` 照常用，压缩解压全在存储引擎里透明发生。

**业界同构物**：MySQL/InnoDB 的溢出页（overflow page）、MongoDB 的 GridFS 思路、Elasticsearch 的 source 压缩——所有行式/文档存储都要回答“值比页大怎么办”，答案长得都差不多：压缩 + 外置 + 透明还原。

## 3.3 N+1 是什么？

经典 ORM 反模式的定义：**取 N 条父记录后，为每条单独发一次子查询——总共 N+1 次往返**。

```
本场景的具体形状（桶里有 2000 个 chunk）：

坏写法（N+1）：
  SELECT id, chunk_text FROM document_chunk WHERE ...;      ← 1 次（拿 2000 行）
  for chunk_id in 2000个id:
      SELECT tokenized FROM document_chunk WHERE id=%s;     ← 2000 次！
  = 2001 次网络往返 × 每次约 0.5-2ms = 秒级纯开销，全是往返不是计算

好写法（批量 IN）：
  SELECT id, chunk_text FROM document_chunk WHERE ...;      ← 1 次
  SELECT id, tokenized FROM document_chunk
      WHERE id IN (%s,%s,...,%s);                          ← 1 次（或按 500-1000 一批）
  = 2~3 次往返
```

代码里 `_get_tokenized_batch` 干的就是第二种。名字的由来就是那个公式：1 次主查询 + N 次子查询。它在 ORM 里最臭名昭著（Django/SQLAlchemy 的 lazy-load 关系默认就这么干），所以成了面试通用词。

## 3.4 全景：两层结构 + “模型”到底是什么

先回答“模型是什么”——**BM25Okapi 是统计模型，不是神经网络**。它“拟合”出来的是一组语料统计量：

| 模型成分 | 是什么 | 依赖什么算出来 |
|---|---|---|
| N | 语料文档总数 | 整桶所有 chunk |
| df(t) / IDF(t) | 每个词出现在几篇文档 / 由此算的稀有度权重 | **整桶所有 chunk** |
| doc_len / avgdl | 每篇长度 / 平均长度（做长度归一） | 整桶所有 chunk |
| k1、b | 曲线形状参数（TF 饱和速度、长度惩罚强度） | 固定超参，不依赖语料 |

**注意第二行：IDF 是全语料统计量——往桶里加 1 篇新 chunk，N 变了、很多词的 df 变了、avgdl 变了，整个模型的 IDF 权重表全部偏移。**这个事实是理解下面所有失效逻辑的钥匙。

两层结构全景图：

```
┌─────────────────── 第二层：PG（持久化，磁盘） ───────────────────┐
│  document_chunk 表                                                │
│  ┌────┬──────────────────┬──────────────────────────────┐        │
│  │ id │ chunk_text       │ tokenized (TEXT, LZ4 TOAST)   │        │
│  ├────┼──────────────────┼──────────────────────────────┤        │
│  │ 1  │ "部署流程文档…"   │ "部署 流程 文档 部署 流程 …"   │ ←分词缓存│
│  │ 2  │ "Redis 高频…"    │ NULL                          │ ←没分过 │
│  │ 3  │ (新导入)         │ NULL                          │ ←天然NULL│
│  └────┴──────────────────┴──────────────────────────────┘        │
│  粒度：per-chunk。存的是"昂贵中间产物"（jieba 分词结果）          │
│  寿命：跟 chunk 行同生共死（chunk 删了它跟着删）                  │
└──────────────────────────────────────────────────────────────────┘
                            │ 建桶时批量读上来（IN 查询防 N+1）
                            ▼
┌────────────── 第一层：进程内存（易失，LRU 管理） ─────────────────┐
│  _corpus["5:17"]  = {id → chunk 原文、元数据}   ← 语料正文        │
│  _models["5:17"]  = BM25Okapi 实例              ← 统计模型！      │
│                     （IDF 表 + doc_freqs + doc_len，纯内存对象）   │
│  粒度：per-bucket（user:kb）。桶变更 → 整个模型作废重建           │
│  上限：桶数≤16 / 总 chunk≤100k，超了 LRU 逐出                    │
└──────────────────────────────────────────────────────────────────┘
```

**两层各存各的理由**：贵的（jieba 分词，秒级 CPU）做细粒度持久化——变更只重算一条；便宜的（BM25 统计拟合，万级 chunk 毫秒级纯内存计算）就不持久化——变了重算即可。

## 3.5 读路径逐步走查（回答你圈的两个问号）

**“现场分什么词？内存里存的 chunk 还是没有持久化的 chunk？"**

分的是**刚从 PG 读进内存的这批 chunk 的原文**（`chunk_text`），且只分 `tokenized` 列为 NULL 的那些。完整时序：

```
某用户首次搜 KB17（桶 5:17 不在内存）
 1. load_from_database：SELECT 该桶全部行 → _corpus["5:17"]（原文进内存）
 2. _get_tokenized_batch（防 N+1 的批量 IN 查询）：
      SELECT id, tokenized WHERE id IN (这桶的 2000 个 id)
      ├─ 1999 条非 NULL → text.split(' ') 直接还原 token 列表（毫秒）
      └─ 1 条 NULL（比如 chunk 2）→ jieba.cut_for_search(它的 chunk_text)
            → token 一边用，一边批量写回 PG：UPDATE ... SET tokenized=...
 3. 用完整 token 集构建 BM25Okapi（纯内存统计，毫秒级）→ _models["5:17"]
 4. 打分返回
下次（重启后）再搜：第 2 步全命中 → jieba 一次都不跑 → "秒~十秒级 → 毫秒级"
```

**"从 PG 中读加载到内存中建桶？"——对，你理解的就是准确的**：建桶 = 把这桶的行从 PG 读进 `_corpus` + 把分词缓存读上来 + 在内存里拟合出 BM25Okapi。

## 3.6 写路径与“置脏”——你的质疑命中了一个不严谨的说法

你问“新增 chunk，什么缓存置脏？为什么新增会置脏？”——**问得非常准**。严格说，我之前那句“新增/修改自动失效”是压缩表述，拆开是两种完全不同的情况：

**情况 A：纯新增 chunk（主场景）**

```
新增 chunk（新 id）→ PG 里插入新行，tokenized 自然就是 NULL
  ← 这里没有任何东西被"置脏"！新行本来就没有缓存可脏
  ← 你的直觉是对的：新增无脏可置
真正受影响的是【第一层内存模型】：
  BM25Okapi 的 IDF 是全桶统计 → 桶里多了 1 篇 → N、df、avgdl 全变
  → 旧模型的权重表已经描述不了新语料 → _invalidate_model("5:17") 作废它
  → 下次搜索重建（重建很便宜：token 全在 PG 缓存里，毫秒级）
```

所以新增的准确语义是：**PG 层零成本（新行天然 NULL），内存层模型作废重建（毫秒级）**。

**情况 B：更新已有 chunk 的文本（`ON CONFLICT DO UPDATE SET tokenized = NULL` 真正服务的场景）**

```
chunk 1 的内容被改了（同 id，新文本）
  → 旧行的 tokenized 是【旧文本】的分词 —— 现在是错的！
  → UPDATE 时显式置 NULL："这份缓存已不可信，作废"
  → 下次读到 NULL → 只重分这 1 条 → 写回新分词
```

这才是“置脏”的本体：**旧缓存对应旧数据，数据变了缓存必须标坏**。至于“这个场景我们有吗”——诚实说：业务主路径是**新增**（上传文档、FAQ 蒸馏、KB 克隆）和**删除**（重导时先删后加），直接改写已有 chunk 文本是低频边路；但写入接口是幂等 upsert 契约（设计文档 01 §3.2 明确写了 `add_document_chunk` 走 `ON CONFLICT DO UPDATE`），**契约上必须覆盖“同一 id 重新写入”的情况**，否则一旦发生就是静默的错分词。

**情况 C（彩蛋）：KB 克隆连缓存一起搬**

Stage 2-3 报告有一行：“clone_knowledge_base 复制 KB/文档/chunk/增强/FAQ **+ tokenized 缓存**”——克隆出来的 KB 首次搜索连分词都不用重算，因为缓存被成行复制过去了。这归功于缓存就是表里的普通一列：**它跟着数据走，不需要任何额外搬运逻辑**（又一个“单一事实源”红利，Redis 旁路缓存绝无此待遇）。

## 3.7 粒度演化总结表

| | 阶段 0（裸奔） | 现在（两层） |
|---|---|---|
| 分词成本粒度 | 整桶（万级 chunk 秒~十秒级 jieba） | **单 chunk**（变更谁重算谁） |
| 分词结果寿命 | 进程内存，重启即失 | PG 持久化，跨重启、跨克隆 |
| 统计模型粒度 | 整桶重建（含分词） | 仍整桶重建，但重建 = 读缓存 + 毫秒级内存统计（**不含分词**） |

“从桶变到 chunk 级别对吧？”——精确表述：**贵的部分（分词）从桶级降到 chunk 级；便宜的部分（统计拟合）留在桶级，但因为它变便宜了所以无所谓**。

---

## Q3 · 第5轮 · 追问

SELECT id, chunk_text FROM document_chunk WHERE ...;      ← 1 次（拿 2000 行）

  for chunk_id in 2000个id:

      SELECT tokenized FROM document_chunk WHERE id=%s;     ← 2000 次！为什么不在第一个查询的 where 条件里，就把所有需要查询的字段写出来呢？而是先查 ID，然后去查分词缓存，但是他查的都是同一张表呀

在读的过程中，如果需要去读内存，发现分词结果为空，就需要去分词。分词之后，内存里面有了，那 PG 里面是怎么同步的呢？
以及在写的时候，增和删操作需要同时处理内存 LRU 和 PG，是吧？这有没有什么顺序先后的问题？肯定得事物吧这个。

## A3 · 第5轮

# 一、N+1 澄清：那段代码是“反例演示”，不是项目代码

先把误会解开：**我上一轮贴的 `for chunk_id in 2000个id: SELECT ...` 是“N+1 这个概念长什么样”的反例演示**——展示如果不小心会写成什么样。它不是项目的实现。这是我的讲解缺陷（反例没标注醒目，已记 BUG-025）。

项目真实形态贴出来：

```389:407:backend/services/bm25_client.py
    def load_from_database(self) -> int:
        """
        从 PostgreSQL 全量加载所有 document_chunk 到内存索引。
        在应用启动时调用一次即可，之后增量更新由 index_chunk/bulk 负责。
        ...
            rows = db.fetchall(
                """
                SELECT dc.*, kb.user_id
                FROM document_chunk dc
                LEFT JOIN knowledge_base kb ON dc.knowledge_base_id = kb.id
                """
            )
```

```1403:1411:backend/services/database.py
    def get_tokenized_by_ids(self, chunk_ids):
        """01-C：批量读取分词缓存。返回 {chunk_id: [tokens]}，仅含已缓存（tokenized 非NULL）的条目。"""
        if not chunk_ids:
            return {}
        placeholders = ','.join(['%s'] * len(chunk_ids))
        query = f"SELECT id, tokenized FROM document_chunk WHERE id IN ({placeholders}) AND tokenized IS NOT NULL"
```

**一个桶的全生命周期就 2 条查询**：①启动时一条全表查询（所有桶的语料）→ ②这个桶第一次被搜索时一条批量 IN（只查这个桶的 tokenized）。2001 次那种事从未发生。

## 那为什么不把 ① 和 ② 合并成一条？（你的真问题）

三层原因，一层比一层根本：

**原因一：发生的时间不同。** ①在**启动**时执行（eager、全量、所有桶）；②在**某个桶第一次被搜索**时才执行（lazy、单桶）。启动时根本不需要 token——BM25 模型本身是懒构建的（首次搜索才建），启动只要语料镜像 `_corpus`。设计文档对此有明文契约：“`load_from_database`（bm25_client.py:294-328）保持只读原文进 `_corpus`，**不再触发任何分词**”。

**原因二：查询的形状不同。** ①是全表 JOIN（不带任何 id 条件，扫全部行）；②是 id 集合 IN 查询（只碰这桶的 ~2000 个 id）。一条 SQL 没法同时是这两种形状。硬合并只有两个方向，各有代价：

```
方向 A：把 tokenized 并进启动查询
  → 启动时为「从未被搜索的桶」白付 TOAST 解压 + 传输
  → 启动结果集变大、变慢 —— 违背「启动 <2s 可服务」的整个 01-B 目标

方向 B：把语料加载推迟到首搜（和 tokenized 一起查）
  → 首请求要等全表加载 —— 旧「启动慢」的问题原样搬家到「首请求慢」
  → 更糟
```

**原因三：职责契约不同。** ①的职责是“读原文、建数据镜像”；②的职责是缓存逻辑（NULL 判断 → jieba 补算 → 写回）。缓存逻辑整个住在 `_get_tokenized_batch` 里，不渗进加载路径——两段各自简单。

**一个诚实的代码观察**（顺着你的质疑挖出来的）：①实际写的是 `SELECT dc.*`——**tokenized 列其实被顺带拉回来了，但没被使用**（`_corpus` 条目只存 id/属主/原文/元数据，token 值被丢弃）。所以现状有一条小小的优化空间：①改成显式列清单，既省传输又语义更清楚。这也说明“两条查询”更多是**职责/时序的设计选择**，而不是传输量上的精打细算。生产 SQL 避免 `SELECT *` 的经典理由（拉了不用的列、表结构变更时脆弱、破坏覆盖索引）在这里全部应验。

**N+1 教学闭环**：这个概念的病根从来不是“查了两次”，是**往返次数**——同表查 2 次没问题，逐条查 2000 次才是病。你现在的理解已经越过概念本身、直接问到了“两条查询能不能是一条”这个更深的设计题——这是好状态。

---

# 二、分词之后怎么同步回 PG

完整时序（`_get_tokenized_batch`，全部真码）：

```
某桶首次搜索 → 建模型需要全部 token：
  1. get_tokenized_by_ids(这桶全部 id)          ← 一条 IN 查询
     ├─ 命中的（tokenized 非 NULL）→ text.split(' ') 还原
     └─ missing（tokenized IS NULL）↓
  2. 对 missing 逐条 jieba.cut_for_search(原文)  ← 原文来自【内存 _corpus】，
  3. db.set_chunk_tokenized_batch(new_tokens)      不是再查 PG
     → UPDATE document_chunk SET tokenized = ' '.join(tokens) WHERE id = %s
       （executemany 批量执行）
  4. cached.update(new_tokens) → 用完整 token 集建 BM25Okapi → 返回
```

回答你圈的两个点：

**“现场分什么词？内存里存的 chunk？”**——分的是内存 `_corpus` 里那些 chunk 的 `content` 原文（启动时从 PG 读进来的）。它们不是“没有持久化”——原文一直好好地在 PG 的 `chunk_text` 列里；没有持久化的只是**分词结果**（`tokenized` 列是 NULL），所以才要现场算。

**“分词之后 PG 里面怎么同步的？”**——**算完立刻同步写回**（第 3 步紧跟第 2 步，同一个函数调用内），术语叫 **write-through on miss**（未命中时穿透写回），不是攒一批异步刷。为什么选立即写：进程如果在写回前崩了，这次分词白算（PG 留 NULL，下次重算）；窗口越小，浪费概率越低。

**失败语义（fail-open）**：看 `set_chunk_tokenized_batch` 的实现——`try/except` 包住，失败只打日志 `return 0`，**不抛异常**。于是：写回失败 → 本次搜索照常（token 已经在内存里把模型建完了）→ PG 留 NULL → 下次再算那几条 → 自愈。**缓存写失败的最坏代价 = 下次多算一条，永远不会变成用户可见的错误。**

这一步也不需要你问的“事务”：PG 是权威源、写回是幂等的纯 UPDATE、失败模式的代价是“重算一次”——没有一致性风险，事务在这里是杀鸡用牛刀。事务真正值得讨论的地方在增删路径，也就是下一节。

---

# 三、增/删时，内存和 PG 的双写：顺序、事务、还有“两层”的精确结构

## 3.1 先回答“肯定得事务吧这个”

分两层说：

- **PG 自己内部**：有事务。单条 `INSERT ... ON CONFLICT ...` / 单条 `DELETE` 本身就是原子的（单语句事务）——PG 不会写到一半。
- **PG 和进程内存之间**：**不存在事务设施**。内存不可回滚、没有两阶段提交可用。你能做的不是“保证原子”，而是**选顺序，让崩溃窗口里的失败模式落在安全的一侧**。

## 3.2 安全侧的选择原则

```
权威源（PG）先行，派生缓存（内存）后动：
  崩溃夹缝里留下的是「缓存缺失/陈旧」→ 下次自愈，安全 ✓

反过来（内存先行）：
  夹缝里留下的是「幽灵缓存」→ 服务不存在/已删除的数据 → 危险 ✗
```

## 3.3 增：导入管线的实际顺序

```
① db.add_document_chunk（PG，原子单语句）
     INSERT INTO document_chunk (...)
     ON CONFLICT (document_id, chunk_index) DO UPDATE SET
         content = EXCLUDED.content,
         metadata = COALESCE(EXCLUDED.metadata, document_chunk.metadata),
         tokenized = NULL        ← 01-C：内容变更自动置脏分词缓存
② bm25.index_chunk（内存）：_corpus[key][chunk_id] = {...}
③ _invalidate_model(key)：模型缓存作废
```

```1323:1331:backend/services/database.py
    def add_document_chunk(self, document_id, chunk_index, content, metadata=None, knowledge_base_id=None):
        """添加文档块（幂等：同一 document_id + chunk_index 重复插入时更新内容）"""
        query = '''
            INSERT INTO document_chunk (document_id, knowledge_base_id, chunk_index, content, metadata)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (document_id, chunk_index) DO UPDATE SET
                content = EXCLUDED.content,
                metadata = COALESCE(EXCLUDED.metadata, document_chunk.metadata),
                tokenized = NULL  -- 01-C：内容变更自动置脏分词缓存
```

崩溃窗口分析：①写完②没执行就崩 → 内存不知道新 chunk → 搜不到它直到重启 → **陈旧，安全方向** ✓。（“为什么加一条要作废整个模型”上一轮讲过：IDF 是全桶统计量，加一篇使 N/df/avgdl 全变。）

## 3.4 删：诚实讲，两个方向都有理论缺陷

内存侧的真实代码：

```344:356:backend/services/bm25_client.py
    def delete_chunk(self, chunk_id: int, user_id: int) -> bool:
        """删除单个 chunk 索引。需要在所有桶中查找。"""
        try:
            for key in list(self._corpus.keys()):
                parsed_user, _ = key.split(":", 1)
                if str(parsed_user) == str(user_id) and chunk_id in self._corpus[key]:
                    del self._corpus[key][chunk_id]
                    ...
```

（“需要在所有桶中查找”是因为多桶设计：chunk 可能在属主桶，也可能在增量写入者的桶。）

两个方向的分析：

```
PG 先删 + 崩溃 → 内存幽灵：搜索继续返回已删内容（直到重启）
内存先删 + 崩溃 → PG 残留 → 重启时全量重载，数据"复活"
```

**删这一侧没有绝对安全的顺序**——这是单进程内存索引的固有窗口（两条语句之间的微秒级），本系统的最终修复点是**重启全量重载**（从 PG 重建一切）。业界的完整装备只有在分布式/合规场景才必须上：**tombstone 墓碑**（删除标记广播给所有副本）、**版本号校验**（缓存条目带数据版本，读时比对）、**TTL 有界陈旧**（缓存条目最多活 N 秒，错误有上限）、**失效广播**（Redis pub/sub 通知各实例逐出）。

## 3.5 “两层”的精确版本：内存里其实是两个角色不同的结构

你说“应该有两层吧”——对，但内存这层内部还要再分：

| 结构 | 角色 | 谁动它 | 丢了怎样 |
|---|---|---|---|
| `_corpus` | **数据镜像**（跟 PG 同步增删） | 导入/删除管线 | 重启从 PG 重载 |
| `_models` | **派生统计**（BM25Okapi，IDF 权重表） | 懒构建 / 失效 / LRU 逐出 | 毫秒级重建（token 缓存在 PG） |

所以“增删要同时处理内存 LRU 和 PG”的准确说法是：**增删动的是 `_corpus` + `_models`；LRU 逐出只动 `_models`**（逐出桶模型时语料镜像原地不动——下次搜索重建模型时数据还在手边）。一句话收束本节：

> **事务保证“PG 自己不半途而废”；顺序设计保证“PG 和内存之间崩溃了也偏向安全”；重启是最终一致性修复点。**

---
