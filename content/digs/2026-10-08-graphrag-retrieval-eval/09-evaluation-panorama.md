---
title: 评估数据全景 · 数字弹药库
date: 2026-10-08
order: 9
description: 五块实验的数据量与结果全景：B 轮延迟六组（23.5×/4.3× 出处）、graph 补测、C 轮1 32q×8 对象（RAGAS+BEIR 循环论证版）、C 轮2 300q×3 对象（KB65 千库图谱全量）、A/B 四方案兜底 100%；每个数字带出处，最后一张"数字使用分级"防抓清单：王牌/带声明引/禁用。
tags: ["评估", "数字弹药库", "RAGAS"]
---

## Q1 · 第6轮 · 初始

然后我想知道我们每个测评部分的数据量，以及对应测出的结果

## A1 · 第6轮

## §1 总览：五块实验的数据量 × 结果

| 实验块 | 时间 | 数据量 | 对象数 | 核心结果 | 出处 |
|--------|------|--------|-------|---------|------|
| B轮1 延迟对比 | 09-04 | KB17 140 docs；40请求@10并发/组；6组 | 6 | native 1847ms vs LightRAG 43.3s（**23.5×**） | `result_round1.json` |
| B轮 graph 补测 | 09-04 | 同上；2组 | 2 | graph 9.9s vs LightRAG hybrid 42.9s（**4.3×**） | `result_graph.json` |
| C轮1 RAGAS+BEIR | 09-07 | **32 query** × 8 对象 = 256 次评估；KB17 自建 gt | 8 | faith 0.969 vs LightRAG 0.798（**+21%**） | `2026-09-04-c-round1-result.md` |
| C轮2 RAGAS+BEIR | 09-10/11 | **300 query**；KB65=1000 docs/1099 chunks/3419 ent/2061 rel | 3 | graph Recall 0.880 / faith 0.846；总耗时 ~13h | `2026-09-11-c-round2-result.md` |
| A/B 四方案 | 09-11 | 10q + 50q×3 组 | 4 | 兜底 hit **100%**（其余三方案 80-89%） | 同上 §4.5 |

---

## §2 逐块展开

### 块 1 · B轮1：延迟六组（p50/p95/p99/QPS/err 全量）

**数据量**：KB17 = 140 docs 中文（本项目导出 → LightRAG 双向导入）；每组 40 请求 @ 10 并发，top_k=10，预热 2；全组 err=0。环境：ada-002 embedding(1536) + gpt-4o via litellm，12 核/15.6GB。

| 组 | p50 | p95 | p99 | QPS |
|---|---:|---:|---:|---:|
| native_rerank_off | **1847ms** | 4100 | 4102 | **5.60** |
| lightrag_naive_rerank_off | 43322ms | 62172 | 62322 | 0.19 |
| native_rerank_on | 135101ms | 148402 | 149391 | 0.09 |
| lightrag_naive_rerank_on | 44931ms | 61244 | 62683 | 0.19 |
| hybrid_vec | **2167ms** | 5380 | 5380 | **4.46** |
| lightrag_hybrid | 42556ms | 59923 | 60692 | 0.20 |

倍数口径：native 23.5×、hybrid_vec 19.6×、QPS 29×。**注意 native_rerank_on 135s 这一行**——它就是简历第一条超订阅治理的起点数据（两题共用此数，讲的时候声明“同源压测，第一条讲它的成因与治理，本条只用它的横向对比”）。

### 块 2 · B轮 graph 补测（同类“向量+图”对比）

**数据量**：同 KB17，40@10。前置：entity_vectors 同步 Milvus 耗时 4180s（≈70min，两实例 + token 50min 自动刷新）。

| 组 | p50 | p95 | p99 | QPS |
|---|---:|---:|---:|---:|
| graph_ours | **9901ms** | 14010 | 15940 | 1.1 |
| lightrag_hybrid | 42884ms | 61884 | 62364 | 0.19 |

### 块 3 · C轮1：32 query × 8 对象（KB17，评估体系首秀）

**数据量**：32 条 gt（FAQ promote + session 历史提取 + LLM 生成补量，人工抽检 20%）；32 × 8 = 256 次评估；judge = 智谱 GLM-4-Flash-250414；每对象评估耗时 770-1120s。

**RAGAS 四指标**（faith / ans_rel / ctx_pre / ctx_rec）：

| 对象 | faith | ans_rel | ctx_pre | ctx_rec |
|------|------:|-------:|-------:|-------:|
| kb17_supplement(baseline) | 0.882 | 0.758 | 1.000 | 0.956 |
| native_rerank_off | 0.939 | 0.765 | 1.000 | 0.975 |
| native_rerank_on | 0.900 | 0.758 | nan† | 0.988 |
| advanced | 0.941 | 0.762 | 1.000 | 0.988 |
| **hybrid_vec** | **0.969** | 0.763 | nan† | 0.965 |
| keyword | 0.880 | **0.781** | 1.000 | **0.992** |
| lightrag_naive | 0.798 | 0.752 | nan† | 0.802 |
| lightrag_hybrid | 0.768 | 0.763 | nan† | 0.858 |

†nan = 智谱 429 限流致部分样本失败（后 4 个对象撞上限流窗口），可信 4 对象全 1.000。

**BEIR 三指标**（⚠️ qrel 循环论证版，只能带声明引用）：

| 对象 | nDCG@10 | Recall@10 | MRR@10 |
|------|--------:|----------:|-------:|
| native_rerank_off(=baseline) | 0.585 | 0.988 | 0.618 |
| native_rerank_on | 0.389 | 0.525 | 0.441 |
| advanced | 0.389 | 0.525 | 0.441 |
| hybrid_vec | 0.422 | 0.615 | 0.461 |
| keyword | 0.395 | 0.538 | 0.426 |
| lightrag_naive | 0.002 | 0.006 | 0.004 |
| lightrag_hybrid | 0.014 | 0.006 | 0.031 |

**这张表三行都要会讲“为什么不说明质量差”**：rerank 反降 = qrel 只标了 native 召回的同质 doc（循环论证）；LightRAG 0.002 = chunk id 空间不重合；graph 本轮**漏列**（spec 失误，C 轮2 补上）——三个诚实声明点本身就是面试弹药。

### 块 4 · C轮2：300 query × 3 对象（CRUD-RAG 公开集，graph 首次全量）

**数据量（分层背）**：
```
数据集层: CRUD-RAG questanswer_1doc 子任务 800 条 → 取 300(seed=20260907)
          每条: question(人工编写) + answer(人工标注 gt) + news1(源文档)
qrel 层:  1-to-1(query i → crud_{i:03d})
KB65 层:  1000 docs = 300 rel(query源文档) + 700 non-rel(entity抽取用)
          → 1099 chunks
图谱层:   3419 entities + 2061 relations(0.6条/entity; FlashX+qwen3.8-flash双端抽取,
          46个 import timeout 后 sync 脚本补齐)
执行层:   3并发 fill ~1.5h + BEIR ~45min + RAGAS一轮 ~4h + answer重生成 15min×3
          + RAGAS二轮+graph ~6h = 总计 ~13h
```

**BEIR（n=300）**：

| 模式 | nDCG@10 | Recall@10 | MRR@10 |
|------|--------:|----------:|-------:|
| native_rerank_off | 0.988 | 1.000 | 0.988 |
| native_rerank_on | 0.992 | 1.000 | 0.992 |
| graph(四项改造后) | 0.877 | **0.880** | 0.877 |

**RAGAS（n=300，answer=glm-4-air 重生成后）**：

| 模式 | faith | ans_rel | ctx_pre | ctx_rec |
|------|------:|-------:|-------:|-------:|
| native_rerank_off | 0.900 | 0.701 | 1.000 | 0.996 |
| native_rerank_on | 0.914 | 0.696 | 0.981 | 1.000 |
| graph | 0.846 | 0.676 | 0.918 | 0.925 |

**附带产出（LLM 生成质量对照，n=300）**：glm-4-flashx 第一轮 faith 0.54 / ans_rel 0.37，60.7% 拒答 → 换 glm-4-air 重生成 0.90 / 0.70（+66% / +87%）——评估体系反向抓出生成端瓶颈的证据。

**未完成项（NFCorpus，只构建未评估）**：corpus 3633 docs、100 query 子集（avg 48 rel/query）、qrel 12334 pairs（3 级相关度，high-rel 182 对）——数据集和 gt 生成脚本齐全，RAGAS/BEIR 未跑。

### 块 5 · A/B 四方案 + 辅助分析

**数据量**：降阈值组 10 query；二跳/LIKE/兜底各 50 query；hit 判定 = 返回 doc 命中 1-to-1 qrel。

| 方案 | hit | avg_chunks | 样本 |
|------|----:|-----------:|------|
| 降阈值 0.5→0.3 | 80% | 1.2 | 10q |
| 二跳 hop=2 | 89% | 1.7 | 50q |
| LIKE 模糊匹配 | 86% | 1.34 | 50q |
| **graph 兜底** | **100%** | **~9** | 50q |

**辅助分析**：锚点匹配率 61%（20 query：LLM 提 41 锚点、PG 精确匹配 25）；二跳延迟代价部分 query 94s。

---

## §3 数字使用分级（防抓清单）

| 级别 | 数字 | 使用规则 |
|------|------|---------|
| **王牌**（直接引） | 23.5×/19.6×、4.3×、QPS 29×；C轮1 faith 0.969 vs 0.798、ctx_rec 0.992 vs 0.858；C轮2 native Recall 1.000；A/B 100%/~9 chunks；0.6 条/entity；61% 锚点匹配率；faith 0.54→0.90 | 出处已核实，带口径直接讲 |
| **带声明引** | 88%（注明 300q BEIR 口径，兜底后 100% 是 50q A/B，样本量不同）；“<2%”（分母=graph 查询总延迟）；C轮1 BEIR 全表（先讲 qrel 循环论证）；C轮2 graph 全部指标（先讲“数据集非 graph 主场 + 关系稀疏”框架）；KB17 图谱 77 ent/1108 rel（50 docs 抽取口径） | 先给口径再给数 |
| **禁用** | “向量匹配快 4-5×”（未插桩）；LightRAG 内部各环节耗时拆解（未插桩）；graph 改造前 p50 ~70s（无实测出处）；NFCorpus 任何评估结果（没跑）；端到端 agent p50（没压） | 被问就如实说“未测/估算” |

**KB17 文档数的双口径提醒**：B/C 轮 = 140 docs（handoff “重导入 140 docs”），而第一条简历 Stage 4 压测 = 110 docs/1999 chunks——同一 KB 不同时期版本，两题各用各的，别混说。

---

**收束**：这张表就是总复习图“数字弹药库”的骨架。数据量演进本身就是方法论故事线的一部分：32 query 自建 gt（快速验证）→ 300 query 公开集（消除自证）→ A/B 10/50 query（快速对照）——**样本量跟着实验目的走，不是越大越好**。下一块你选：a) 开始合成总复习图初稿（把这几轮全部收进去）；b) 继续深挖某一块（比如 C轮1 BEIR 三行“为什么不说明质量差”的完整讲法）。
