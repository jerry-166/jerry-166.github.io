---
title: 存储真相与蒸馏纠偏
date: 2026-10-14
order: 2
description: 代码实锤纠偏：蒸馏是原地升级不是搬家（FAQ ≠ graph/chunk）、Milvus faq 集合只存 question 向量、BM25 不索引 FAQ、半衰期衰减降数字不降身份、heat_score 无消费方的诚实声明，以及存储总表与 FAQ 一生的数据流。
tags: ["蒸馏", "Milvus", "存储模型"]
---

## Q1 · 第2轮 · 初始

Mirrors 内部存了 FAQ 的这条信息吗？我记得 FAQ 可以去蒸馏，蒸馏之后呢？蒸馏成啥了？蒸馏成 graph 和 trunk 了是吧？

为什么阈值要按“写入时快照”存进每条记录（distill_threshold 字段）而不是实时查配置：①升格判断时不用回查 KB 归属（记录自带答案）；②KB 后续分享状态变了，已种下的 candidate 仍按种下时的污染面判定——风险敞口在写入那一刻就锁定了，这是个很干净的审计语义。

为什么惰性更新（只在命中时算，无后台定时任务）：Cron 扫全表是“为了一个大多时候不看的字段持续付费”；惰性计算把成本精确摊到“真正发生命中”的时刻。零额外基础设施，简单可解释。

快照克隆不追上游（有意为之）：符合“补全是我个人当时的知识快照”语义；上游修错了 FAQ，下游克隆版保留旧答案反而是“我的 fork 我做主”的 GitHub 语义。（faq会存到bm25里面吗？）

半衰期衰减（冷门自动降权）会影响已经蒸馏的内容吗？

faq都会存在哪里？以什么形式？会被处理成什么样子？

## A1 · 第2轮

全部核实完毕。你这轮的问题里有**一个必须当场纠正的误解**（面试时说错会露馅），其余问题都查了代码实锤。逐个来。

---

## 1. 先纠正最大的误解：蒸馏 ≠ 变成 graph 和 chunk

**不是。蒸馏后的产物还是 FAQ，只是换了“内容”和“身份”，存储位置一步都没挪。**

你混淆的根源是架构文档里“分层蒸馏”这个词——L0→L2→L3 的“蒸馏”是**比喻知识逐层提炼**，不是说 FAQ 会被转化成下层形态。三条线必须分清：

```
文档导入线（与 FAQ 闭环无关）：
  上传文档 → 切 chunk（L0/L1）→ EntityEnhancer 抽实体/关系 → entity/entity_relation（L2）
  ↑ graph 是从 chunk 抽出来的，发生在【导入时】，不是从 FAQ 蒸馏出来的

FAQ 闭环线（简历第三条）：
  用户补全 → 种 candidate FAQ → 热度达标 → 蒸馏 → active FAQ
                                            ↑
                                    还是 FAQ！原地升级
```

蒸馏那一刻实际发生的事（`distill_and_promote`，`faq_service.py:283-330`）：

| 动作 | 动了哪个存储 | 具体变化 |
|---|---|---|
| 读：检索该 KB top-3 chunk 当参考材料 | 只读，**不写回** | chunk 只是蒸馏的“参考资料”，像写论文查文献 |
| LLM 改写 answer | **只 UPDATE PG** | 口语原文 → 结构化答案（`promote_faq(faq_id, answer=distilled)`） |
| status 变更 | 只 UPDATE PG | `candidate → active` |
| Milvus 向量 | **一动不动** | question 没变 → 向量无需重算 |

最后一行是精妙处：**蒸馏只改 answer 和 status，question 原封不动**——而 Milvus 里存的只是 question 的向量（见下），所以蒸馏全程零 Milvus 写操作。这是“只向量化 question”设计的直接回报。

---

## 2. "Mirrors"（你指的应该是 **Milvus**）里存了 FAQ 吗？

**存，但只存“召回所需的最小字段”，answer 根本不在 Milvus 里。** 实际 schema（`milvus_client.py:236-244`）：

```
Milvus faq 集合：
  id              INT64  (auto_id 主键)
  pg_faq_id       INT64  ← 指回 PG 权威行的外键
  kb_id           INT64  ← 可见范围过滤字段
  question        VARCHAR(2000)   ← 原文，召回后直接展示用
  question_vector FLOAT_VECTOR    ← IVF_FLAT + COSINE 索引
  created_at      INT64
```

**没有 answer、没有 status、没有热度字段。** 原因：

- 召回语义是“**用户的问题像不像库里存过的问题**”——问题对问题匹配，只需要 question 向量
- 命中后要查状态（candidate 还是 active）和答案 → 回 PG 按 `pg_faq_id` 取——**“PG 为权威，Milvus 为索引”**：PG 是账本（什么都有），Milvus 是目录卡片（只管找到）
- 回报就是上面说的：answer 随便改写（蒸馏）、status 随便迁移（升格/降级），Milvus 毫无感知，永不重算 embedding

`search_faq`（`milvus_client.py:469-491`）：`kb_id in [可见KB]` 过滤 + question_vector COSINE 检索，返回 `pg_faq_id + question`，状态判定回 PG。

---

## 3. FAQ 会存到 BM25 里吗？—— **不会**

`bm25_client.py` 全文搜不到任何 faq 相关代码。BM25 内存索引**只索引 document_chunk**（关键词检索的对象是文档原文）。佐证在 `clone_kb` 里最明显——克隆时两个存储各搬各的：

```404:409:backend/services/faq_service.py
            chunks = db.get_document_chunks_by_ids(list(result["chunk_map"].values()))
            ...
            get_search_client().bulk_index_chunks(chunks)   ← BM25 只进 chunk
```

Milvus 侧才搬 faq 向量（`clone_kb_vectors` 里的 faq 段，直接搬运 `question_vector` 不重新 embedding）。

**为什么 FAQ 不进 BM25**：FAQ 匹配要的是语义相似（“怎么配缓存” ≈ “缓存如何设置”），向量擅长；BM25 是字面关键词重合，帮不上。且 FAQ 量级小（每 KB 几十~几百条）、已有 0.9 严阈值 + LLM 确认兜底，单路向量够用——再加一路是过度设计。

**如果被追问“什么时候该加”**：向量对否定词、小改动不敏感（“怎么开启缓存” vs “怎么关闭缓存”距离很近），若要支持**精确问法复现**（一字不差重问秒命中）或 FAQ 库长到万级，BM25 补字面精确匹配就有价值了。当前场景不需要。

---

## 4. 半衰期衰减会影响已蒸馏的内容吗？—— **影响一个数字，不影响任何行为**

精确回答分三层：

1. **status 不受影响**：衰减只重算 `heat_score` 数值，绝不动状态。active 永远 active（除非库主手动 demote），直返资格 = `status=='active' && score≥0.9 && LLM确认`，判据里**没有 heat_score**。
2. **heat_score 会持续衰减**：距上次命中每过 7 天减半，半年没人问 ≈ 0.001。
3. **诚实声明（重要）**：heat_score 目前**没有任何消费方**——我核对了，`list_faqs` 排序是 `ORDER BY updated_at DESC`（`database.py:627`），不用 heat_score；升格判据用 hit_count；也没有自动淘汰。它是**为未来“冷知识排序/淘汰”预留的字段**，架构文档里“冷门不永占坑”是设计意图，自动降级未实现。面试被问“heat_score 谁在用”，诚实说“预留 + 分工设计”：**hit_count 记录历史事实（被需要过几次，管升格），heat_score 反映当前状态（现在还热不热，管未来淘汰）**——两个指标各司其职，后者暂时待岗。

---

## 5. FAQ 到底存在哪、什么形式、被处理成什么样（总表 + 生命周期图）

**存储总表**：

| 存储 | 存什么 | 形式 | 写入时机 |
|---|---|---|---|
| **PG `faq` 表** | 全量：question、**answer 原文**、hit_count / last_hit_time / heat_score、status 三态、distill_threshold、owner_id / submitter_id、source | 行记录（**权威账本**） | 种 candidate / PR merge / 克隆 / 蒸馏（UPDATE） |
| **Milvus `faq` 集合** | pg_faq_id、kb_id、question、**question_vector** | 向量（**召回目录**） | 种 candidate / PR merge / 克隆；**蒸馏时不写** |
| **PG `faq_pr` 表** | PR 队列（待审 Q&A 副本 + 审核状态/留痕） | 行记录 | 无直写权补全 / 显式提 PR |
| **BM25** | ❌ 不存 FAQ，只索引 chunk | — | — |
| **缓存（KB cache_version）** | 不存 FAQ 本体，但 FAQ 五个写路径都 bump 版本触发检索缓存失效 | 版本号 | 写路径发生时 |

**FAQ 一生的数据流**（每一步标注动了谁）：

```
①种candidate   PG:INSERT一行(status=candidate,threshold=2/3快照)  Milvus:insert question向量
     │                (answer口语原文入库)                        (先删后插,幂等)
     ▼
②每次命中      PG:UPDATE hit_count+1 / heat_score重算 / last_hit_time     Milvus:不动
     │          (candidate命中→只累计不直返;active命中→直返)
     ▼
③热度达标      读:Milvus查该KB top-3 chunk(只读!当蒸馏参考材料)
  蒸馏升格     写:PG UPDATE answer=LLM结构化改写, status→active    Milvus:不动
     │         (question没变→向量永不重算)
     ▼
④直返          Milvus:question_vector召回 → PG:查status+answer → 返回
     │         (跳过整个检索漏斗+生成,sources_count=0)
     ▼
⑤demote/delete  PG:UPDATE status / DELETE行    Milvus:delete_faq_vector
               (delete时PG为主,Milvus删除失败仅warning"可重建")
```

**双写一致性原则**（贯穿所有操作）：PG 永远先写成功，Milvus 失败只 warning——因为 Milvus 里的一切都能从 PG 重建（代码里多处注释“PG 数据完整，可重建”），反过来不成立。

---

## 6. 你贴的三段引用：理解全部正确，各补一个新证据

- **阈值写入时快照** ✅ → 补：克隆时 `distill_threshold` 被原样复制（`database.py:825`），克隆版即使再分享出去，旧 candidate 仍按旧阈值——快照语义连克隆都穿透。
- **惰性更新** ✅ → 补：惰性到什么程度？`list_faqs` 排序用 `updated_at` 而非 heat_score，heat_score 连排序都不参与——整个系统里它只在“命中那一刻”被算，其余时间就是个躺着的数字。零基础设施成本名副其实。
- **快照克隆不追上游** ✅ → 补：克隆连 `hit_count`、`heat_score`、`status` 都原样搬（`database.py:823-825`）——不只 FAQ 内容是快照，**热度史和状态也是快照**。“我的 fork 我做主”贯彻得很彻底。

---

## 记忆锚（这轮就记这四句）

1. **“蒸馏是原地升级，不是搬家”**——FAQ 永远是 FAQ，只改 answer 和 status，question 和向量不动。
2. **“PG 是账本，Milvus 是目录”**——Milvus 只有 question 向量，answer/状态/热度全在 PG；Milvus 可全量重建。
3. **“FAQ 不进 BM25”**——语义匹配走向量，BM25 只管 chunk；克隆代码里两套索引各搬各的就是证据。
4. **“衰减降数字不降身份”**——heat_score 会归零但 active 永远 active；且 heat_score 目前无消费方（诚实说预留）。
