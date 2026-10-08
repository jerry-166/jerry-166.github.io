---
title: STAR 主线 · GraphRAG 检索+评估体系
date: 2026-10-08
order: 1
description: 简历第二条的两版 STAR 全景：v1（功能假成功的检测与修复暗线：BUG-020 → 关系稀疏 → 四项改造 → A/B 验证）与 v2（创造性叙事：build → measure → improve → re-measure），含数字核对清单、与简历第一条的数据边界、业界对照与后续深挖地图。
tags: ["GraphRAG", "STAR", "面试叙事"]
---

## Q1 · 第1轮 · 初始

# 任务：拆解我简历第二条（沿用第一条的深挖方法论）



我在准备后端/RAG 方向面试。简历第一条（混合检索+精排+超订阅治理）已经过六轮深挖并合成总复习图

（D:\workspace\demo\test_面试准备\resume_深挖\总复习图_混合检索精排与线程超订阅治理.md，可参考其结构）。

现在用同样方法拆第二条，工作目录是本项目 d:/workspace/rag-for-qw。



## 简历原文

> 2.GraphRAG 检索+评估体系：GraphStrategy实现四项改造——LLM结构化锚点提取、实体语义对齐、LLM 关系重排、

> 关系直查原文；A/B验证graph兜底使hit rate 88%→100%、延迟占比<2%，定位关系稀疏根因(0.6条/entity)；

> 同环境查询链路p50较LightRAG 快23.5×(1.8s vs 43.3s)；以RAGAS四指标+BEIR格式数据集建立评估体系。



## 本轮第一步要交付什么

先从代码和报告里挖出全部相关事实，给一份 STAR 全景：

什么场景 → 之前怎么做的（旧 GraphStrategy 长什么样）→ 出了什么问题 → 怎么发现/看出来的 →

怎么排查 → 怎么修复（四项改造逐项）→ A/B 和评估的对比效果。数字全部来自实测并标注出处（哪份报告哪一节/哪行代码）。

后续我会逐块追问深挖，你先给全景。



## 素材地图（已探明的入口，先读这些再动手，不要凭空答）

设计：

- docs/plans/2026-09-09-graph-strategy-upgrade.md（四项改造的设计文档：旧版三大缺陷/新流程图/配置项/风险回滚）

- docs/plans/2026-09-01-ragas-quality-evaluation-design.md（评估体系设计）

结果与验证：

- docs/plans/2026-09-11-c-round2-result.md、2026-09-07-c-round2-result.md、2026-09-07-c-round2-handoff.md

  （C 轮 RAGAS 评估结果，hit rate 88%→100% 大概率在这里）

- docs/plans/2026-09-04-lightrag-final-report.md（LightRAG 对比 + BUG-020 entity noop 修复：

  修复后 KB17 抽到 77 entities + 1108 relations；graph 同环境对比 9.9s vs LightRAG hybrid 42.9s = 4.3×）

代码：

- backend/services/retrieval_strategies.py 的 GraphStrategy（_extract_anchor_entities / _embed_entity_texts /

  _rerank_relations / execute 的降级链）

- backend/services/enhancers/ 下导入侧 entity enhancer；PG 表 entity / entity_relation（database.py）；

  Milvus entities_collection 的写入与 search_entities（milvus_client.py）

- backend/agent/claw_agent/tools/rag_tools.py（graph 输出汇入统一 reranker）

Bug 记录：.buglog/bugs/2026-09-01-entity-noop-missing-check.md（BUG-020）



## 数字核对清单（开讲前必须核实口径，防止面试被抓）

1. **23.5× vs 4.3× 两个口径**：23.5×（1847ms vs 43.3s）是 native 模式 rerank 关的对比；graph 模式同环境

   同类对比是 4.3×（9.9s vs 42.9s）。简历里"查询链路 p50 较 LightRAG 快 23.5×(1.8s vs 43.3s)"用的是哪个

   口径、怎么自圆其说，必须先讲清楚。

2. **0.6 条/entity 的出处**：KB17 修复 BUG-020 后是 77 entities + 1108 relations（均值 ≈14.4 条/entity），

   与"0.6 条/entity"差 24 倍——0.6 大概率来自 C 轮评估数据集（CRUD-RAG/KB65 等）或不同统计口径

   （比如只算某跳/某类型关系）。必须定位原始出处，讲清分母分子各是什么。

3. **hit rate 88%→100% 与"延迟占比<2%"**：A/B 实验的对照组是什么（graph 兜底 vs 什么）、样本量、

   "延迟占比"的分母是什么（占总查询的请求数还是占 p50 的时间）。



## 三条固定要求（全程有效，每次输出都要考虑）

1. **详细映射**：每个术语/数字/机制都展开讲透，不假设我已知——工具怎么选、指标怎么定义、参数为什么这么设、

   换场景怎么迁移。宁可过度展开，我会追问收窄。

2. **关联串起**：把大事件串成因果时间线方便记忆。本条的暗线参考：BUG-020（entity 抽取 noop →

   图谱从未真正运行）→ 修复后图谱才跑起来 → 暴露关系稀疏(0.6/entity)与 hit rate 88% → 四项改造 →

   A/B 验证 → RAGAS 四指标 + BEIR 格式评估体系。把这条链讲成"功能假成功的检测与修复"的完整故事。

3. **业界做法对比**：每个"我们的做法"配"业界主流做法"+ 为什么我们没选。重点对照：

   Microsoft GraphRAG 标准流程（社区摘要/全局推理/索引成本 $20-500+）vs 我们的 GraphRAG-lite on

   Milvus+PG；LLM 锚点提取 vs NER 模型；RAGAS vs Trulens/DeepEval；BEIR vs 自建评估集。



## 呈现与工作方式

- 呈现多样：ASCII 图/时序图/表格都行，一切以我理解记忆为主；逐块生成，一步一步来。

- 先挖代码和文档再回答；引用代码带行号；发现文档与代码矛盾、数字对不上要明确指出。

- 诚实原则：未达预期如实记录（第一条深挖时"复验 70s 未达预测 10s 不硬凑"就是加分项，本条同样适用）；

  与简历第一条的数据边界要分清，防止两题数字互相污染。

- 如果深挖过程中发现代码缺陷值得修复，先跟我确认影响面再动手，并按 .buglog/ 流程记录。

- 深挖完成后（预计多轮），合成总复习图存到

  D:\workspace\demo\test_面试准备\resume_深挖\总复习图_GraphRAG检索与评估体系.md，

  结构对齐第一条（§0 主干/§1 地图/§2 时间线/§3 模块卡片/数字弹药库/§5 追问速答/§6 诚实声明/§7 业界对照/§8 记忆锚）。

## A1 · 第1轮

# 第二条 · GraphRAG 检索+评估体系 · STAR 全景（第 1 轮）

> 挖掘范围：2 份设计文档 + 5 份结果报告 + 6 个代码文件 + 2 个关键 commit（`4841911` 四项改造 / `3bd5779` 兜底）+ BUG-020 记录 + BEIR 原始数据。
> 所有数字标注出处；发现 2 处口径问题和 1 处评估未完成项（见 §3、§5）。

---

## §0 三句话主干（先建立骨架，后续逐块深挖）

1. **场景与问题**：项目已有 GraphRAG-lite 架构（导入侧 LLM 抽实体关系 → PG 存图 + Milvus 存实体向量，查询侧锚点→一跳扩展→关联 chunk），但两次实测暴露问题——BUG-020 让图谱整整一个阶段**从未真正运行**（noop 条件漏查 entity，返回 200 但 PG 实体数为 0）；修复跑通后 C 轮评估又暴露检索质量短板（BEIR Recall@10 仅 0.88，每 query 只召回 ~1 个 chunk）。
2. **修复**：对齐 GraphRAG 标准流程做四项改造——LLM 结构化锚点提取（name+description）、实体语义空间对齐（entity embedding 替代 query embedding）、LLM 关系重排（过滤噪声关系）、关系直查原文（source_chunk_id 主路径）；A/B 测试四种改进方案后确定“graph 精准 + native 兜底”混合策略。
3. **验证**：A/B 实测兜底使 hit rate 88%→100%、avg_chunks 1→9、兜底延迟占比 <2%；根因定位到导入侧关系稀疏（2061 relations / 3419 entities = 0.6 条/entity）；同环境对比 LightRAG：native 链路 p50 快 23.5×（1.8s vs 43.3s）、graph 同类对比快 4.3×（9.9s vs 42.9s）；以 RAGAS 四指标 + BEIR 格式数据集（KB17 + CRUD-RAG-300）建立可持续评估体系。

---

## §1 因果时间线（暗线：一个“功能假成功”的检测、修复与再检测）

```
09-01        09-04              09-07                09-09              09-09~10           09-11
BUG-020      B轮LightRAG对比      C轮1质量评估          四项改造            KB65图谱build        C轮2结果+兜底
─────────    ──────────────     ────────────────     ─────────────      ──────────────     ────────────────
用户直觉:     延迟: native 23.5×   KB17: faith 0.969    设计文档定稿         700 non-rel docs    BEIR: graph
"图谱没真正   graph补测: 4.3×     vs LightRAG 0.798   commit 4841911      entity抽取          Recall 0.880
 运用"?      └─graph能跑了!      (评估体系首秀,        (~150行,4改造点)    (FlashX+qwen双端)   ↓为何只有0.88?
  ↓证实       ↑前提:BUG-020       graph当时漏列)                            3419 ent+2061 rel   A/B四方案:
noop条件漏查  修复后图谱才                            ↑改造的靶子         ↓暴露               降阈值/二跳/LIKE
entity→图谱  真正接入                                                                  全部无效
从未执行      ┌─────────────── 评估体系的价值 ───────────────┐                             ↓根因
返回200+秒回  │ 没有C轮评估,就发现不了0.88和0.6/entity,      │                             关系稀疏
+数据为空     │ 四项改造就没有靶子,兜底就没有依据            │                             ↓兜底
              └────────────────────────────────────────────┘                             hit 88%→100%
                                                                                        commit 3bd5779
```

**30 秒串联叙事**：这条经历的本质是**“功能假成功”的完整检测-修复-再检测闭环**。第一阶段：图谱功能代码存在、接口返回成功，但一个 noop 条件 bug 让它从未执行——靠“返回 200 + 速度异常快 + 数据为空”三特征识破（BUG-020）。第二阶段：修复后图谱真正跑起来，才能首次拿到 graph vs LightRAG 的同类对比（4.3×）。第三阶段：但如果只有延迟对比没有质量评估，改造就无的放矢——C 轮 RAGAS/BEIR 评估暴露出 Recall 只有 0.88、每 query 只有 1 个 chunk。第四阶段：根因排查（锚点匹配率 61%？阈值太严？跳数不够？）逐项证伪，最终定位导入侧关系稀疏（0.6 条/entity），四项改造 + 兜底解决。**每一阶段的结论都由上一阶段的评估数据驱动**——这是“评估驱动迭代”的完整案例。

---

## §2 STAR 全景

### S · 场景：为什么需要 GraphRAG

- **业务需求**：企业知识库存在“多跳关联查询”——问“A 和 B 什么关系”、“X 依赖的技术 Y 在哪份文档”，纯向量检索按语义相似度召回，query 和目标文档没有直接词汇/语义重叠时（答案需要跨文档实体关联）会 miss。
- **已有架构**（Stage 3 文档 06，commit `2370509` 引入，全部为项目自研）：
  - **导入侧** `backend/services/enhancers/entity.py`：`EntityEnhancer` 对每个 chunk 调 LLM 抽取实体（name/type/description）+ 关系（head/relation/tail/evidence），pydantic 模型 `EntityItem`/`RelationItem` 结构化输出（`entity.py:20-35`）
  - **存储分工**：PG `entity` 表（`UNIQUE(kb_id, name)`，同名实体合并 source_chunk_ids，`database.py:311-323`）+ `entity_relation` 表（含 `evidence` 和 `source_chunk_id` 字段，`database.py:324-335`）存**权威图数据**；Milvus `entities_collection`（`pg_entity_id/kb_id/name/description/description_vector`，IVF_FLAT 索引，`milvus_client.py:259-285`）存**实体向量**做锚点语义匹配
  - **查询侧** `GraphStrategy`（注册于策略表，`retrieval_mode="graph"`）+ KB 级开关（KB 未启用 entity 增强则 entities_collection 置 None，`milvus_client.py:755-756`）
- **术语展开——为什么叫"GraphRAG-lite"**：对标 Microsoft GraphRAG 的完整形态（社区检测 + 分层摘要 + 全局 map-reduce 推理），本项目只保留“实体锚点 + 关系扩展 + 证据回链”核心链路，存储复用已有的 PG + Milvus，无图数据库、无社区摘要、无 NetworkX——**轻量是架构决策不是偷懒**（对照见 §6）。

### A-旧 · 旧版 GraphStrategy 长什么样（commit `4841911^`，2026-09-09 之前）

```
用户 query ──→ ① LLM 提取实体名(List[str], 纯文本分行解析)
                    │
              ② 双路锚点发现
                    ├─ 路A: name 精确直查 PG find_entities_by_names
                    └─ 路B: query_embedding 匹 Milvus description_vector  ← 缺陷1
                    │
              ③ PG 一跳扩展 get_entity_neighbors
                    │   └─ relations 变量拿到后…只打了条日志  ← 缺陷2（白查）
              ④ 收集所有实体的 source_chunk_ids → 取 chunk 原文
                    │   （每实体平均挂 N 个 chunk，不精准）    ← 缺陷3（绕路）
              ⑤ 机械打分: 锚点 chunk 0.9 / 非锚点 0.75        ← 缺陷3（无相关性判断）
```

旧版代码证据（`git show 4841911^:backend/services/retrieval_strategies.py`）：
- L325-347 `_extract_anchor_names()`：返回 `List[str]`，prompt 是“只输出实体名，每行一个”，`text.strip().splitlines()` 裸解析
- L375 `data=[self.ctx.query_embedding]`：用**问题向量**匹**实体描述向量**
- L406 `relations, neighbor_ids = db.get_entity_neighbors(anchor_ids, ...)`：`relations` 在整个 execute 里再未被引用——设计文档原话“关系只被当作找邻居的跳板，没参与下游逻辑”
- L423-426：chunk 收集只走 `entity.source_chunk_ids`

**三大缺陷的设计文档定性**（`docs/plans/2026-09-09-graph-strategy-upgrade.md` §1）：
1. **语义空间不一致**：疑问句向量 vs “名词+陈述”向量，分布有偏移，路 B 命中率低
2. **关系数据白查**：一跳扩展拉出的关系（含 evidence、relation_type）完全没被利用
3. **缺关系相关性判断**：机械分数排序，噪声关系照进结果

### 问题怎么发现的（两层暴露）

**第一层：图谱从未运行（BUG-020，2026-09-01）**
- 触发：用户直觉“实体图谱没真正运用”，要求做“向量+图”对比
- 三特征指纹：generate 140 docs **返回 200** 但 **20 秒完成**（0.14s/doc，物理上不可能调 LLM）+ **PG entities=0** + 日志“增强器已全部关闭”
- 根因：两个上层调用点的 noop 条件 `if not (need_subq or need_summary)` 硬编码只查两种 enhancer，漏了 entity——entity-only KB 在上层被短路，`EnhancerPipeline` 本身实现是对的（`.buglog/bugs/2026-09-01-entity-noop-missing-check.md`）
- 修复：`processing.py:298-301` 与 `document_processor.py:150` 两处加 `need_entity = "entity" in enabled`
- 验证：修复后 KB17 真调 LLM，PG 抽到 **77 entities + 1108 relations**（`docs/plans/2026-09-04-lightrag-final-report.md` §三）

**第二层：跑通之后质量不达标（C 轮2，2026-09-10/11）**
- KB65（CRUD-RAG 语料）构建图谱：**3419 entities + 2061 relations**（GLM-4-FlashX + qwen3.8-flash 双模型抽取 700 non-rel docs，46 个 import timeout 后用 `sync_entity_vectors.py` 补齐）
- BEIR 300 query 全量评估：graph **nDCG@10 0.877 / Recall@10 0.880 / MRR 0.877**，而 native baseline 是 0.988/1.000/0.988（`beir_c2_summary.json`，n=300）
- RAGAS：graph faithfulness 0.846 vs native 0.900/0.914
- 直接症状：**graph 每 query 只返回 ~1 个 chunk**（native 返回 10 个）

### 怎么排查的（逐项假设 → A/B 证伪 → 根因收敛）

```python
# 排查过程的假设树（每条都有 A/B 实测，负结果如实记录）
假设1: 关系重排阈值 0.5 太严，把关系滤光了？
  → 降到 0.3 (hop=1):  hit 80% (10q), avg_chunks 1.2   ✗ 无效，关系本来就少
假设2: 一跳不够，信息在两跳外？
  → hop=2 (score=0.3): hit 89% (50q), avg_chunks 1.7    ✗ 微升但噪声多+慢(部分 94s)
假设3: 锚点没匹配上实体？(辅助证据: analyze_anchor.py 20q 分析,
        LLM 提取 41 锚点, PG 精确匹配 25 个 = 61%, miss 原因: 括号/引号/全称简称)
  → LIKE 模糊匹配 (hop=1, score=0.5): hit 86% (50q)     ✗ 锚点多了但关系还是少
根因: 数据侧,不在查询侧
  → 2061 relations / 3419 entities = 0.6 条/entity       ✓ 关系稀疏
  → 证据: 导入侧 ENTITY_TEMPLATE 明确写着
    "关系数量控制在 0~5 条，宁缺毋滥" (entity.py:43)     ← 抽取策略自己造成的稀疏
```

（出处：`docs/plans/2026-09-11-c-round2-result.md` §4.5/§4.6、§7.3；A/B 脚本 `work/c-round2/ab_test_graph.py`、`analyze_anchor.py`）

**这条排查链的面试价值**：三个查询侧假设全部证伪，最后根因在**导入侧数据质量**——如果没有 A/B 逐项排除，很容易拍脑袋继续调查询参数。同时 LIKE 虽然单独无效但保留在代码里（`database.py:934-966`，精确匹配 miss 后取 name 核心部分做 `%pattern%`，LIMIT 3），因为它是正确性问题（61% 匹配率确实低）而非效果问题。

### 修复 · 四项改造逐项（commit `4841911`，2026-09-09，~150 行，`retrieval_strategies.py:348-666`）

| # | 改造 | 旧 → 新（代码位置） | 为什么这么设计 |
|---|------|---------------------|----------------|
| 1 | **LLM 结构化锚点提取** | `List[str]` 裸解析 → `List[dict]` `{name, description}`（L363-405） | pydantic `_AnchorEntities` **复用导入侧 `EntityItem` 模型**，prompt 约束“一句话客观描述 ≤30 字，不要发挥”——让查询侧锚点与导入侧实体**同一种语言**，为改造 2 铺路。`build_chain` 用 `PydanticOutputParser + OutputFixingParser`（`enhancers/base.py:125-130`），格式错自动修复。LLM 调用仍是 1 次（max_tokens 300，temperature=0） |
| 2 | **实体语义空间对齐** | `query_embedding` 匹 description_vector → **entity `"name：description"` 的 embedding** 去匹（L407-425, L521-552） | 疑问句 vs 名词陈述的分布偏移，通过把查询侧文本变成**与入库侧同构的实体描述**消除。每个锚点 embedding 各搜 top5 合并进 anchor_ids；降级链：embedding 失败→只用路 A name 直查→再空→降级 native |
| 3 | **LLM 关系重排**（graph 独有） | 无 → `_rerank_relations`（L427-494） | 关系终于被用起来。把 `head_name —[relation_type]→ tail_name \| evidence[:100]` 组装给 LLM 打 0-1 分（**带实体名不带 id，因为 LLM 看不懂 id**），pydantic 输出 `{relation_id, score}`，过滤 `< GRAPH_RELATION_MIN_SCORE=0.5`（`config.py:137`）。**两处 fail-open**：调用失败保留全部关系；全被过滤也保留全部——图检索是增强，不能因 LLM 抖动比没有还差 |
| 4 | **关系直查原文**（路径 B 为主） | 只走 entity.source_chunk_ids 绕路 → `relation.source_chunk_id` 直拉证据原文（L582-614） | 关系从哪个 chunk 抽出来，那个 chunk 就是证据——比“实体挂的所有 chunk”精准。分层：路径 B chunk 打 0.9，兜底路径 A（source_chunk_id 为 null 的旧数据，取两端实体 source_chunk_ids）打 0.75 |

**第五项（简历外但必须会讲）：graph 兜底**（commit `3bd5779`，L622-636）
- 逻辑：重排后 chunk 数 < limit 时，补一段 native 向量召回的 chunk 填位（`_REGISTRY["native"](self.ctx).execute(limit)`），补充 chunk 排在 graph 高置信（0.9）之后
- **设计本质**：承认关系稀疏是数据现状，在数据修复（改 ENTITY_TEMPLATE 增加关系抽取量，属导入侧迭代）之前，用“graph 精准优先 + native 召回兜底”的混合策略保证下限——graph 管精度上限，native 管 Recall 下限
- 同 commit 附带：LLM 调用全部加 `request_timeout=30` + `asyncio.wait_for`（reranker/search/graph 三处，修 hang 问题）、LIKE 模糊匹配

### R · 结果与验证

**A/B 测试（兜底 vs 三种无效方案，`2026-09-11-c-round2-result.md` §4.5）**

| 方案 | hit rate | avg_chunks | 判定 |
|------|---------:|-----------:|------|
| 降阈值 0.5→0.3 | 80%（10q） | 1.2 | 无效 |
| 二跳 hop=2 | 89%（50q） | 1.7 | 微升但噪声多+慢（部分 94s） |
| LIKE 模糊匹配 | 86%（50q） | 1.34 | 锚点准了但关系少，无效 |
| **graph 兜底** | **100%（50q）** | **~9** | **唯一有效** |

**评估体系（C 轮1 + C 轮2 两轮迭代）**
- **指标**：RAGAS 四指标（faithfulness 答案忠实度 / answer_relevancy 切题度 / context_precision 上下文精确度 / context_recall 上下文召回）评**生成质量** + BEIR 三指标（nDCG@10 / Recall@10 / MRR@10）评**纯检索质量**——两组指标分离是关键设计：RAGAS 的 context 指标受 LLM 干扰，BEIR 只看 ranking 对不对
- **数据集**：KB17（32q，LLM 生成 gt，同质技术文档——C 轮1）→ CRUD-RAG-300（中文公开集，人工标注 gt，1-to-1 qrel——C 轮2 用公开集**消除“同质 doc 自证”批评**）
- **基建复用**：`backend/evaluation/{evaluator,dataset}.py` + REST 端点（`/api/evaluation/dataset/from-sessions`、`fill/{name}`、`run`、`reports`）是 Stage 3 已有资产，C 轮只新增 `fill_from_lightrag` 变体和 BEIR 自实现脚本（pytrec_eval 因 Windows TLS 问题装不上，自实现 nDCG/Recall/MRR——`2026-09-01-ragas-quality-evaluation-design.md` §二）
- **judge 限流治理**：智谱 GLM-4-Flash 免费 tier 256 次/窗口 ~1h reset，429 时轮换 DashScope qwen3-flash（代价：两模型评分尺度可能有跳变，已声明）

**C 轮1（KB17）核心结论**（`2026-09-04-c-round1-result.md`）：本项目 5 模式 faithfulness 0.880-0.969 全面高于 LightRAG 0.768-0.798（+21%），根因是本项目单步生成严格基于 contexts，LightRAG 多步编排引入额外内容。

**LightRAG 延迟对比（B 轮，`2026-09-04-lightrag-final-report.md`）**：公平性铁律——同数据（KB17 双向导入）、同 embedding、同 LLM、同硬件（12 核/15.6GB）、40 请求@10 并发、全组 0 错误。native rerank 关 1847ms vs 43.3s（23.5×）、hybrid 19.6×、graph 同类对比 9.9s vs 42.9s（4.3×）。根因：**LightRAG 查询期多步 LLM 编排（keyword+实体+图遍历+生成）是延迟大头，不是向量检索慢**。

---

## §3 数字核对清单（开讲前必须背熟的口径裁定）

### 口径 1：23.5× vs 4.3× —— 两个都对，但描述的是不同链路

| 倍数 | 对比组 | 环境 | 出处 |
|-----|--------|------|------|
| **23.5×** | 本项目 **native（rerank 关）** p50 1847ms vs LightRAG **naive** 43322ms | KB17、同 embedding/LLM/硬件、40@10、err 0/40 | `result_round1.json`，B 轮1 |
| 19.6× | 本项目 hybrid_vec 2167ms vs LightRAG hybrid 42556ms | 同上 | 同上 |
| **4.3×** | 本项目 **graph** p50 9901ms vs LightRAG **hybrid** 42884ms | 同上（同类“向量+图”） | `result_graph.json`，B 轮补充 |

**简历口径的自圆其说**：简历写“查询链路 p50 较 LightRAG 快 23.5×(1.8s vs 43.3s)”用的是 **native 主力链路**口径。如果面试官追问“graph 模式呢”→ 主动给出 4.3×（9.9s vs 42.9s），并解释 graph 慢于 native 是因为多 2 次 LLM 调用（锚点提取+关系重排，其中锚点提取是瓶颈——报告明确记录可优化方向是缓存锚点/NER 替代）。**千万不要被动被抓**：两个倍数都是同环境实测、都显著，讲清“链路不同”即可。QPS 口径：native 5.6 vs 0.19（29×），graph 1.1 vs 0.19（5.8×）。

### 口径 2：0.6 条/entity —— KB65（CRUD-RAG）的口径，与 KB17 差 24 倍

| 数据集 | entities | relations | 条/entity | 出处 |
|--------|---------:|----------:|----------:|------|
| **KB65**（CRUD-RAG 新闻语料，C 轮2） | 3419 | 2061 | **0.60** | `2026-09-11-c-round2-result.md` §4.6 |
| KB17（同质技术文档，B 轮） | 77 | 1108 | 14.4 | `2026-09-04-lightrag-final-report.md` §三 |

**为什么差 24 倍**：① 语料性质——KB17 是同主题技术文档，实体（“Copilot”“VS Code”）跨文档高频重复、彼此关系密集；KB65 是新闻，每篇独立事件，实体间天然少关联；② 抽取约束——`ENTITY_TEMPLATE` 的“关系数量控制在 0~5 条，宁缺毋滥”（`entity.py:43`）在新闻语料上导致大量 chunk 抽 0-1 条关系。**分子分母**：2061 条关系 ÷ 3419 个实体（KB65 全库）。面试时必须先讲清是哪个 KB 的数字，否则和 KB17 的 14.4 打架。根因修复方向（已写入报告 §7.1 但未执行）：改模板“关系 1~8 条”、放宽宁缺毋滥。

### 口径 3：hit rate 88%→100% 与“延迟占比<2%”

- **88% 的出处已坐实**：BEIR **Recall@10 = 0.880，n=300**（`work/c-round2/beir_c2_summary.json`，graph 改造后、未兜底）。hit 定义 = 检索返回 doc 是否命中 qrel 的 relevant doc（CRUD-RAG 1-to-1 qrel，即 Recall 的二值版）。
- **100% 的口径**：**50 query A/B**（兜底后 50/50，`2026-09-11-c-round2-result.md` §4.5）。
- **必须声明的口径差**：88%（300q）与 100%（50q）**样本量不同**，严格说不是同一集合上的前后对比。可自圆其说的支撑：LIKE 组 50q 得 86%（与 300q 的 88% 一致，说明 50q 子集代表性 OK）；兜底机制上界就是 native 的 Recall 1.000（补充的就是 native 召回）。面试话术：“300 query 全量 BEIR 显示 Recall@10 0.880，随后 50 query A/B 验证兜底方案 hit 100%，avg_chunks 1→9”。
- **“<2%”的分母**：兜底补充的 native 向量召回耗时 **~0.3s**，分母是 graph 查询总延迟（2 次 LLM 调用主导，B 轮 graph p50 9.9s，C 轮 fill 观察在 10-20s 量级）→ 0.3s/15s ≈ 2%。**是时间占比，不是请求数占比**。
- 附带数字：锚点匹配率 61%（20q 分析：LLM 提 41 锚点、PG 精确匹配 25）。

### 口径 4（补充发现）：设计文档里的“改造前 p50 ~70s”无独立实测出处

`2026-09-09-graph-strategy-upgrade.md` §7 写“改造前 graph 基线 p50 延迟 ~70s”，但检索所有报告，graph p50 实测只有 B 轮 KB17 的 9.9s；70s 应是 C 轮2 fill 期间（含限流重试）的观察估算，**改造后也未单独复测 graph p50**。面试被问“改造对延迟的影响”时，诚实回答：设计预期“多 2 次 LLM 调用，略升可接受”，实际以 B 轮 9.9s 为参照，未做改造前后 p50 专项对比——这属于**评估未覆盖项**，不要编数。

---

## §4 与简历第一条的数据边界（防两题互相污染）

| 数字 | 归属 | 边界说明 |
|------|------|---------|
| **23.5×（1.8s vs 43.3s）** | ⚠️ **两题共用** | 第一条总复习图 §0 已引用它作为“治理后性能横向参照”；本条再引用是作“架构轻量性证据”。同源实验（B 轮1），两题连问时主动声明：“23.5× 出自同一组 LightRAG 对比实验——第一条用它证明治理后的链路性能，这条用它说明单步查询架构 vs 多步 LLM 编排的架构差异，根因是同一个” |
| BUG-025/026、p50 109→19.7s、超订阅 | 第一条独有 | 本条不碰 |
| BUG-020、0.6/entity、88%→100%、四项改造、4.3× | **第二条独有** | 第一条没出现过 |
| BGE reranker 86% 占比 | 第一条 | 本条的“LLM 关系重排”是 graph 内部的第二级重排，与统一 reranker（`rag_tools.py:229-253`，graph 输出也汇入）是两层不同东西——**面试易混点**：关系重排筛“关系”，统一 reranker 精排“最终 chunk” |
| KB17 的 77+1108 | 本条（BUG-020 验证） | 但注意与第一条的“KB17=110 docs/1999 chunks”是同一 KB 的不同切面 |

---

## §5 诚实声明（本条全景级，后续深挖逐项展开）

1. **graph 改造后质量仍低于 native**：nDCG 0.877 vs 0.99、faith 0.846 vs 0.914。没有硬凑“graph 更好”——结论是“graph 在当前关系密度下是精准补充而非全面替代，兜底保下限，根因修复在导入侧”（报告原文如实记录）。
2. **88%（300q）与 100%（50q）样本量不同**（§3 已裁定）。
3. **NFCorpus 评估未完成**：英文 BEIR 标准集的数据集构建了（`nfcorpus_100.json`、qrel、gt 生成脚本齐全，`2026-09-07-c-round2-result.md` 全表 TBD），但最终 RAGAS/BEIR 报告只有 CRUD-RAG——简历说“BEIR 格式数据集”时，实际完成口径是 **CRUD-RAG（中文）+ KB17（C 轮1）**，NFCorpus 停留在基建完成。被问英文场景就如实说未跑完。
4. **RAGAS 局限**：judge 与被评同家族（self-judge 偏差）、429 限流致部分样本 0 分拉低均值、shared answer 策略（answer 与 contexts 来自不同模式，answer_relevancy 跨模式无差异）、gt 为 LLM 生成（KB17）/人工标注（CRUD-RAG）。
5. **entity 数据不完整**：700 docs 有 46 个 import timeout（有 PG 实体无 Milvus 向量），后补 sync 脚本修复——又一个小型“数据缺口检测”案例。
6. **GRAPH_RELATION_MIN_SCORE=0.5 未充分调参**（报告 §六.5 原文承认），A/B 降 0.3 无效是因为关系总量少而非阈值合理。
7. **二跳是负结果**（89% 但噪声多+慢至 94s）——如实记录无效尝试，与第一条“复验 70s 未达预测不硬凑”同款加分项。

---

## §6 业界对照速查（全景级，深挖时逐项展开）

| 我们的 做法 | 业界主流 | 为什么不选（或何时该选） |
|------------|---------|------------------------|
| GraphRAG-lite（PG+Milvus 复用，单遍 LLM 抽取，无社区摘要） | Microsoft GraphRAG：Leiden 社区检测+分层摘要+全局 map-reduce；索引成本 $20-500+（LLM 调用量大） | 我们场景是企业 KB 精准问答不是语料级 summarization；成本不可控；查询期只 2 次 LLM 调用保住延迟。若业务要“这个库整体讲了什么”类全局问题，标准 GraphRAG 才是对的 |
| LLM 锚点提取（+pydantic 结构化） | NER 模型（spaCy/BERT-NER/GLM4-NER）：毫秒级、可本地 | 开放域实体+自带 description 是 LLM 优势；代价是延迟（报告已承认锚点提取是 graph 延迟瓶颈，缓存/NER 是优化方向）——**这是有实测数据支撑的技术债认知** |
| RAGAS 四指标 | Trulens（RAG triad+feedback functions+追踪）、DeepEval（pytest 风格+G-Eval） | RAGAS 指标定义清晰、langchain 集成顺、社区标准（论文可引）；Trulens 强在线上追踪而非离线对比，DeepEval 强在 CI 化——我们当时需求是离线 A/B 对比 |
| 自建评估基建（evaluator+REST+testsets 可复用） | BEIR 官方 harness / RAGAS 官方 testset 生成 | 复用了项目已有评估模块（成本考量）；代价是 pytrec_eval 装不上自实现指标（正确性可验但少了社区背书） |
| CRUD-RAG 公开集 + KB17 自建 | 纯 BEIR 标准集 | 中文业务贴合（CRUD-RAG 中科大发布）；BEIR 标准集（NFCorpus）构建了但没跑完（诚实声明 §5.3） |
| graph 兜底混合策略 | 纯 graph（质量依赖图数据）/ RRF 融合 graph+vector | 关系稀疏期的工程折衷：graph 高置信优先（0.9）+native 保 Recall，代价仅 0.3s——本质是“在数据质量不足时的架构容错” |

---

## §7 建议的后续深挖块（按面试追问概率排序）

1. **BUG-020 深挖**：“功能假成功检测方法论”——noop 模式的普遍性、为什么单测没拦住、与 DevOps 健康检查的对照
2. **四项改造逐项深挖**：每项的设计权衡、参数依据（为什么 0.5、为什么 top5、为什么 ≤5 锚点）、降级链全景
3. **评估体系深挖**：RAGAS 四指标的计算原理、BEIR nDCG 手算、judge 限流的工程处理、数据集构建细节（gt 从哪来）
4. **关系稀疏根因与图数据质量**：0.6/entity 的完整证据链、与标准 GraphRAG 索引的对照、导入侧修复方案设计
5. **LightRAG 对比深挖**：为什么 LightRAG 慢（多步编排拆解）、对比实验设计（公平性铁律）、4.3× 的架构解释
6. **兜底策略深挖**：score 分层设计（0.9/0.75）、与 RRF 的关系、fail-open 家族在本项目的三次应用

---

**本轮交付完毕**。全景已覆盖：因果时间线、旧版代码级证据、排查假设树、四项改造+兜底、A/B 与评估数字（全部标注出处）、三个口径裁定（含 88% 出处坐实为 BEIR Recall@10=0.880 n=300）、与第一条的边界、7 条诚实声明。指出的问题：88%→100% 样本量不同、NFCorpus 未跑完、“70s 基线”无实测出处。

你挑一块开始深挖，我按三条标准（详细映射/关联串起/业界对照）展开。

## Q2 · 第2轮 · 追问

第二条简历内容，我更想从什么地方出发呢？从创造性出发，而不是从有什么 bug 出发，这不是问题，而是一件创造性的事情。（忽略之前graph没有接入的问题）创造之后，后面做了一些对比实验，看它对应的数据是怎么样的，看它的测评数据是什么样的，从这些内容出发...

## A2 · 第2轮

# 第二条 · GraphRAG 检索+评估体系 · STAR 全景 v2（创造性叙事版）

> 框架变更：BUG-020 从主线移除；叙事骨架 = **三个创造物 + 三组实验数据**。上轮已核实的数字口径裁定（§3）、与第一条边界（§4）、诚实声明（§5）、业界对照（§6）全部继续有效，不重复。

---

## §0 三句话主干（重写）

1. **创造**：我设计并实现了 GraphRAG-lite——不引入图数据库，PG 存权威图 + Milvus 存实体向量的双存储轻量架构，导入侧 LLM 结构化抽取实体关系，查询侧“锚点发现 → 关系扩展 → 关系重排 → 证据回链”完整链路；并对照 Microsoft GraphRAG 标准流程做 design review，完成四项改造（结构化锚点、语义空间对齐、LLM 关系重排、关系直查原文）。
2. **量尺**：为了让“自研体系到底好不好”有客观答案，我搭建了 RAGAS 四指标（生成质量）+ BEIR 三指标（检索质量）双轨评估体系，数据集从自建 KB17 迭代到公开集 CRUD-RAG-300（消除自证），并设计了同环境 LightRAG 对比实验（同数据/同模型/同硬件的公平性铁律）。
3. **数据**：同类“向量+图”对比我们快 4.3×（9.9s vs 42.9s，native 主力链路 23.5×）；测评数据显示 graph Recall@10 0.88、每 query 仅 ~1 chunk——这组数字把“关系数据密度”变成可量化的工程参数（2061/3419 = 0.6 条/entity），A/B 四方案证实查询侧调参全部无效、瓶颈在数据侧，最终“graph 精准 + native 兜底”混合策略把 hit rate 提到 100%，兜底延迟占比 <2%。

---

## §1 新主线：build → measure → improve → re-measure

```
[创造]                [量尺]                [演进]               [再量]               [洞察→迭代]
Stage3 架构落地        C轮1 评估体系首秀       09-09 四项改造        C轮2 公开集测评       A/B 四方案
GraphRAG-lite          RAGAS 8对象(KB17)      对照GraphRAG标准      CRUD-RAG 300q        三调参无效
 PG图+Milvus向量       + LightRAG延迟对比     design review         BEIR: Recall 0.88    ↓数据洞察
 EntityEnhancer        09-01~04              (commit 4841911)      faith 0.846          0.6条/entity
 GraphStrategy         native 23.5×           锚点/对齐/重排/回链    chunk~1/query        graph+native兜底
                       graph同类 4.3×          ~150行               (优化空间首次可见)    hit 88%→100%
                                                                                       (commit 3bd5779)
─────────────────────────────────────────────────────────────────────────────────────────────
叙事逻辑: 先造东西 → 再造尺子 → 用尺子和业界标准照出差距 → 改进 → 再量 → 数据指向下一轮方向
面试金句: "我的迭代闭环是 build-measure-learn:图谱架构是我造的,评估体系也是我造的,
          尺子量出的每个数字都驱动了下一步设计决策——0.6 条/entity 不是拍脑袋,是 300 query 测出来的"
```

**为什么这个顺序有说服力**：四项改造（09-09）发生在 C 轮1 评估体系可用（09-07）之后——即“先有尺子，再做改进，改进效果可以复测”。改造的动机是**主动对照业界标准做 design review**（设计文档 §1 原文：“与 GraphRAG 标准流程对比有 3 个真实差距”），不是被 bug 逼着打补丁。这是**设计驱动**的演进，每一步都有标准可依、有数据可验。

---

## §2 三个创造物（“我做了什么”的完整答案）

### 创造物 1：GraphRAG-lite 架构（Stage 3，文档 06，commit `2370509`）

**一句话**：不引入图数据库，用 PG + Milvus 双存储各干最擅长的事，实现完整图谱检索链路。

| 设计决策 | 实现 | 为什么这么设计 |
|---------|------|---------------|
| **图数据放 PG 不放 Neo4j/NetworkX** | `entity` 表 `UNIQUE(kb_id,name)` + `entity_relation` 表（`database.py:311-335`） | 一跳扩展就是一条 SQL（`get_entity_neighbors`，head/tail 双向 OR 查询 + 双索引），事务/运维全复用现有 PG；图数据库对“一跳邻居查询”是杀鸡用牛刀 |
| **实体向量放 Milvus** | `entities_collection`：`pg_entity_id/description_vector`，IVF_FLAT（`milvus_client.py:259-285`） | 锚点语义匹配 = 向量检索，复用现有 Milvus 基建和 embedding 管线；`pg_entity_id` 是两个存储的连接键 |
| **同名实体合并** | `upsert_entity`：合并 source_chunk_ids、description 留更长者（`database.py:851-887`） | 实体跨 chunk 重复出现，“一个实体一份向量 + 多个出处 chunk”比“每 chunk 独立实体”检索效率高 |
| **关系三元组去重** | `add_entity_relation`：(head, relation, tail) 去重（`database.py:889-909`） | 不同 chunk 抽出同一关系只存一条，但 evidence 和 source_chunk_id 保留首遇——图不膨胀 |
| **pydantic 全链路结构化** | `EntityItem/RelationItem` + `build_chain`（PydanticOutputParser + OutputFixingParser 自动修复格式，`enhancers/entity.py:20-35`、`base.py:125-130`） | LLM 抽取格式错误自动重试修复，导入管线不因格式抖动中断 |
| **KB 级开关** | KB 未启用 entity 增强则集合短路（`milvus_client.py:746-759`） | 不需要图谱的 KB 零开销 |
| **抽取质量约束** | ENTITY_TEMPLATE：“实体 1~6 个，关系 0~5 条，宁缺毋滥”（`entity.py:38-49`） | 控制抽取成本与噪声——这个约束后来被数据证明在新闻语料上过于保守（0.6 条/entity），是数据洞察的一部分 |

### 创造物 2：四项改造（09-09，commit `4841911`，~150 行）——对照标准的 design review

**叙事口吻**：“我把自己的实现对照 Microsoft GraphRAG 标准流程逐环节审视，找到三个设计差距，逐项升级”——每个差距 → 一项改造：

| 标准流程的环节 | 我的差距（design review 结论） | 改造 |
|--------------|------------------------------|------|
| 实体识别带上下文语义 | 锚点只有名字（`List[str]` 裸解析） | **改造 1**：`_extract_anchor_entities` 返回 `{name, description}`，复用导入侧 `EntityItem` 模型——查询侧与导入侧**同一种实体语言** |
| 查询-实体语义对齐 | 问题向量（疑问句）匹实体描述向量（名词陈述），分布偏移 | **改造 2**：锚点 `"name：description"` 自身做 embedding 去匹（`_embed_entity_texts`），每个锚点各搜 top5 |
| 关系相关性判断 | 关系数据查出来只当找邻居的跳板，机械按 0.9/0.75 打分 | **改造 3**：`_rerank_relations`——LLM 对每条关系（head —[type]→ tail \| evidence）打分，过滤 <0.5；**带实体名不带 id**（LLM 看不懂 id）；两处 fail-open（失败保留全部/全滤光保留全部）——图检索是增强，LLM 抖动不能比没有还差 |
| 证据可溯源 | chunk 收集绕道“实体挂的所有 chunk” | **改造 4**：关系从哪个 chunk 抽出，那个 chunk 就是证据（`relation.source_chunk_id` 直查，score 0.9；null 时回退实体 source_chunk_ids，0.75）——精准回链 |

**改造的自觉性证据**（面试可引）：设计文档 §7 当时就预写了对 p50 延迟的预期（“多 2 次 LLM 调用，略升可接受”）和回滚预案（分支隔离）——改造不是盲改，是带验收指标和回滚方案的受控演进。

### 创造物 3：评估体系（C 轮，跨 09-01 ~ 09-11）

**一句话**：双轨指标 + 两代数据集 + 限流治理 + 诚实声明文化，让每个设计决策都有数字支撑。

| 组件 | 设计 | 创造点 |
|------|------|--------|
| **双轨指标** | RAGAS 四指标（faithfulness / answer_relevancy / context_precision / context_recall）评生成质量 + BEIR 三指标（nDCG@10 / Recall@10 / MRR@10）评纯检索质量 | 指标分轨是关键：RAGAS 的 context 指标受生成 LLM 干扰，BEIR 只看 ranking 对不对——graph 这类检索策略的改进必须用 BEIR 量，不被生成端噪声污染 |
| **数据集两代** | 一代 KB17 自建（32q，LLM 生成 gt，快速迭代）→ 二代 CRUD-RAG-300（中文公开集，人工标注 gt，1-to-1 qrel） | 公开集消除“同质 doc 自证”的方法论风险；gt 来源升级（LLM 生成 → 人工标注） |
| **基建策略** | 复用 Stage 3 已有 `evaluation/{evaluator,dataset}.py` + 5 个 REST 端点；新增 `fill_from_lightrag` 变体 + BEIR 脚本（pytrec_eval Windows TLS 装不上 → 自实现三指标） | 不重造轮子，但关键缺口自己补 |
| **限流治理** | judge 用智谱 GLM-4-Flash 免费 tier（256 次/窗口），429 时轮换 DashScope qwen3-flash | 免费额度跑完 300q × 7 指标的评估矩阵，成本工程 |
| **诚实声明** | 每份报告固定章节：self-judge 偏差、gt 来源、样本局限、qrel 构建偏差 | 评估结果可信的前提是偏差透明（C 轮1 报告 §五 列了 7 条） |

---

## §3 数据全景（叙事中心：每组数据说明什么）

### 实验一：同环境 LightRAG 对比（B 轮，KB17，`result_round1.json` + `result_graph.json`）

**公平性铁律**：同数据（KB17 双向导入）、同 embedding、同 LLM、同硬件（12 核/15.6GB）、40 请求@10 并发、全组 0 错误。

| 链路 | 本项目 p50 | LightRAG p50 | 倍数 | QPS 比 |
|------|-----------:|-------------:|-----:|-------:|
| native（rerank 关） | 1847ms | 43322ms（naive） | **23.5×** | 5.6 vs 0.19（29×） |
| hybrid_vec | 2167ms | 42556ms（hybrid） | 19.6× | 4.46 vs 0.20 |
| **graph（向量+图，同类对比）** | **9901ms** | **42884ms（hybrid）** | **4.3×** | 1.1 vs 0.19（5.8×） |

**这组数据怎么讲**：
- 同类对比（两边都是“向量+图”）快 4.3×——根因是**架构差异**：LightRAG 查询期多步 LLM 编排（keyword 提取 + 实体抽取 + 图遍历 + 多段生成），我们 graph 仅 2 次 LLM 调用（锚点提取 + 关系重排），图遍历本身是毫秒级 SQL/向量查询
- 数据同时诚实告诉我们：graph 9.9s 比 native 1.8s 慢 5.4×——代价在锚点提取那次 LLM 调用（报告已标注优化方向：锚点缓存 / NER 模型替代），这就是“数据指出下一步”的又一例
- 23.5× 的口径裁定见上轮 §3.1（native 主力链路 vs graph 同类 4.3×，两个都实测、都显著，讲清链路即可）

### 实验二：公开集全量测评（C 轮2，CRUD-RAG-300，`beir_c2_summary.json` 等）

**BEIR（检索质量，300 query）**：

| 模式 | nDCG@10 | Recall@10 | MRR@10 | 数据解读 |
|------|--------:|----------:|-------:|---------|
| native rerank 关 | 0.988 | 1.000 | 0.988 | 该数据集下纯向量召回已接近上限 |
| native rerank 开 | 0.992 | 1.000 | 0.992 | rerank 增益边际（+0.004）——诚实记录，不夸大精排 |
| **graph（改造后）** | **0.877** | **0.880** | **0.877** | 精准但召回窄：avg ~1 chunk/query（native 是 10） |

**RAGAS（生成质量，judge GLM-4-Flash，answer 生成 glm-4-air）**：

| 模式 | faith | ans_rel | ctx_pre | ctx_rec | 数据解读 |
|------|------:|--------:|--------:|--------:|---------|
| native rerank 关 | 0.900 | 0.701 | 1.000 | 0.996 | |
| native rerank 开 | 0.914 | 0.696 | 0.981 | 1.000 | rerank 对 faithfulness +0.014 |
| graph | 0.846 | 0.676 | 0.918 | 0.925 | ctx 两项低与“仅 1 chunk”直接相关——contexts 少，覆盖自然窄 |

**这组数据的价值（面试重点讲法）**：
- **Recall 0.880 + avg 1 chunk 是“评估体系”才能产出的洞察**：没有 300q 公开集测评，你只会感觉“graph 返回少”，不会知道差距是 0.88 vs 1.00、不会知道原因是 chunk 只有 1 个——数字把模糊感受变成工程参数
- 数据同时给出了正确解读方向：graph 的 1 个 chunk 是**高置信精准证据**（关系重排 0.9 分层），低 Recall 不是检索逻辑错，是**输入数据密度**问题——这直接引出实验三

### 实验三：A/B 对照（四方案，`2026-09-11-c-round2-result.md` §4.5）

| 方案 | hit rate | avg_chunks | 数据结论 |
|------|---------:|-----------:|---------|
| 降阈值 0.5→0.3 | 80%（10q） | 1.2 | 阈值不是瓶颈 |
| 二跳 hop=2 | 89%（50q） | 1.7 | 覆盖微升，但延迟飙到 94s——负收益 |
| LIKE 锚点模糊匹配 | 86%（50q） | 1.34 | 锚点匹配率 61% 确实提升，但 hit 不升——瓶颈不在这 |
| **graph 兜底** | **100%（50q）** | **~9** | **唯一达到 native 上限的方案** |

**这组数据的推理链（面试最有含金量的 60 秒）**：
三个查询侧调参（阈值/跳数/锚点匹配）全部无效 → 瓶颈不在查询逻辑 → 统计库内数据：2061 relations ÷ 3419 entities = **0.6 条/entity**（KB65/CRUD-RAG 口径，新闻语料 + 抽取模板“宁缺毋滥”共同造成；对照 KB17 技术文档是 14.4 条/entity）→ 确认是**数据密度**问题 → 查询侧的架构应对 = graph 精准（0.9 高置信优先）+ native 召回兜底（chunk < limit 时补充，~0.3s，占 graph 总延迟 <2%）→ hit 88%（300q BEIR）→ 100%（50q A/B），avg_chunks 1→9。

**迭代闭环的收尾**：根因的最终修复在导入侧（ENTITY_TEMPLATE 放宽关系抽取量），已写入报告 §7.1 作为下一步——查询侧兜底是“数据没修好之前的架构容错”，两条腿分工明确。

---

## §4 沿用上轮的内容（不重复）

- **§3 口径裁定**：23.5×/4.3× 两个口径、0.6 vs 14.4 的数据集差异、88%（300q BEIR）与 100%（50q A/B）样本量差异、"<2%"分母——全部沿用上轮裁定，面试前背熟。
- **§4 与第一条的边界**：23.5× 两题共用需主动声明；BGE 统一 reranker（第一条）与 LLM 关系重排（本条）是两层不同东西。
- **§5 诚实声明 / §6 业界对照**：内容不变，但按新框架**换引用时机**——graph 低于 native 不再是叙事转折点，而是“数据洞察”的自然组成部分（§3 实验二的解读已内置）。

---

## §5 BUG-020 的去处：追问储备牌（不出主干）

按你的要求移出主线，但它是一张**高价值储备牌**——面试官问以下问题时打出：

- “实施过程中踩过什么坑？” / “有没有遇到过很难查的问题？”
- “你的图谱数据是怎么来的、怎么确认它是对的？”
- “讲一个你通过异常信号定位问题的例子”

**牌面（30 秒版）**：图谱上线初期，我靠三个信号发现实体抽取从未真正执行——接口全返回 200、但 140 docs 20 秒就“完成”（0.14s/doc，物理上不可能调 LLM）、PG 实体数为 0。根因是两处上层 noop 短路条件只枚举了两种 enhancer、漏了 entity，而底层 pipeline 实现是对的。修复后 KB17 真抽到 77 entities + 1108 relations。**方法论沉淀**：noop 类 bug 的指纹 = “返回成功 + 速度异常快 + 目标数据为空”；防御 = 短路条件必须覆盖全集，不能硬编码枚举。

（它同时回答“为什么单测没拦住”：单测验证的是“调了返回 200”，没验证“数据真的进了库”——这是断言层级的教训。）

---

## 验证与下一步

**请你先验证这版框架**：主干叙事是否贴合你想表达的“创造性”？数据版块的详略是否合适？确认后按新框架排序的深挖路线：

1. **三个创造物逐个深挖**（架构决策的 why / 四项改造的设计权衡 / 评估体系的指标原理）——新框架的叙事主体
2. **数据解读深挖**：每组数字被追问时怎么展开（nDCG 手算、faithfulness 的 claim 分解原理、4.3× 的架构拆解）
3. **A/B 方法论深挖**：四方案的设计逻辑、控制变量、负结果的价值
4. **0.6/entity 数据洞察深挖**：两个数据集的 24 倍差异怎么讲、导入侧修复方案设计
5. **兜底策略深挖**：score 分层、fail-open 家族、与 RRF 的关系
6. **BUG-020 储备牌深挖**（放最后，按需）

框架没问题的话，我们从第 1 块“创造物 1：架构决策的 why”开始逐块深挖。
