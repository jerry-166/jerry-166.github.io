---
title: GraphStrategy 链路：双索引与 fail-open
date: 2026-10-08
order: 2
description: 一跳扩展 head/tail 双向 OR 查询为什么必须 idx_relation_head/idx_relation_tail 双索引（PostgreSQL Bitmap-OR、缺一边全表扫描退化、Neo4j 邻接表对照），以及 fail-open 失败语义——增强路径回退到无增强基线，本项目四处分场景与 fail-closed 判定标准。
tags: ["PostgreSQL", "索引", "fail-open"]
---

## Q1 · 第2轮 · 初始

head/tail 双向 OR 查询 + 双索引，这里的双索引是啥意思啊？

## A1 · 第2轮

## Q1 “双索引”是什么：`idx_relation_head` + `idx_relation_tail`

一跳扩展的 SQL 是这样的（`database.py:917-920`）：

```sql
SELECT * FROM entity_relation
WHERE head_entity_id IN (锚点id...)      -- 分支1：作为头实体
   OR tail_entity_id IN (锚点id...)      -- 分支2：作为尾实体
```

**为什么一条关系要查两个方向**：`A—[提出]→B` 这条关系，从 A 扩展要靠 `head_entity_id=A`，从 B 扩展要靠 `tail_entity_id=B`——一跳扩展是“锚点实体作为头或尾出现的**所有**关系”，所以必须 OR。

**为什么 OR 需要两个索引**（`database.py:336-338`）：

```
有双索引时:                                     只有一个索引时:
  分支1 → B-tree(idx_relation_head) 索引扫描      分支1 → 索引扫描 (快)
  分支2 → B-tree(idx_relation_tail) 索引扫描      分支2 → 全表扫描 (慢!)
  两路结果 Bitmap-OR 合并                         OR 语义下整体被全表扫描拖垮
```

PostgreSQL 优化器对 `OR` 的两个分支**各自走索引再合并**的前提是两边都有索引可用；少一边，另一边全表扫描，整个查询退化。B-tree 查找 O(logN)，千级关系表毫秒级返回。

**业界对照**：Neo4j 图数据库用物理邻接表（关系链直接挂在节点上），找邻居 O(1) 不需要索引；PG 用 B-tree 是 O(logN)。但对千~万级关系，两者都是毫秒级——这正是“GraphRAG-lite 不上图数据库”的底气：**一跳邻居查询没有复杂到需要专门的图引擎**，一条带双索引的 SQL 就够，还省掉一个运维组件。

---

## Q2 · 第2轮 · 追问

两处 fail-open（失败保留全部/全滤光保留全部）——图检索是增强，LLM 抖动不能比没有还差，啥意思？

## A2 · 第2轮

## Q2 fail-open：增强步骤的失败语义

`_rerank_relations` 里两处（`retrieval_strategies.py:485-494`）：

```python
# 第1处:LLM 调用失败/超时/格式错(异常分支)
except Exception:
    return relations          # ← 返回原始全部关系,当作重排从没发生过

# 第2处:LLM 打完分,所有关系都 < 0.5,过滤后为空
if not kept:
    return relations          # ← 同样返回原始全部
```

**“图检索是增强，LLM 抖动不能比没有还差”拆开说**：

graph 模式在系统里的角色是 native 之上的**增强路径**。重排这个步骤的理想收益是“滤掉噪声关系”；它的失败模式有两种——LLM 调用挂了（超时/限流/格式漂移，即“抖动”），或者打分集体偏低把关系滤光。如果失败时返回空列表，下游 `chunk_ids` 为空 → 触发降级 native → **前面锚点提取、向量匹配、一跳扩展全部白做**，结果是“有重排反而比没重排还差”。fail-open 把失败的最坏后果钳制在“回到没重排的世界”——关系照常进入 chunk 收集，graph 链路保住。

**这是一族设计模式，本项目至少用了四次**：

| 位置 | 失败时行为 |
|------|-----------|
| 关系重排（本处，2 个分支） | 保留全部关系 |
| 统一 reranker（`rag_tools.py:255-256`） | 返回原始排序 top_k |
| L2 检索缓存（`rag_tools.py:123-124`） | 忽略缓存直接检索 |
| native 兜底（graph 内部） | 补充失败不影响 graph 结果 |

**对照 fail-closed**（失败即拒绝）：权限校验、安全过滤该用 closed——检索增强用 open。**判定标准：这个步骤失败时，系统退到哪个状态更安全**。面试一句话：“增强路径 fail-open 回退到无增强基线，安全路径 fail-closed 拒绝服务，我把每一步按这个标准选型。”

---
