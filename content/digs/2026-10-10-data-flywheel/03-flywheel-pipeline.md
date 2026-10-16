---
title: 飞轮管道工程：防重入、归因演进与调度机制
date: 2026-10-10
order: 3
description: 第2轮模块二——手动 trigger 防重入（409 Conflict 语义、双倍 judge 烧钱、数据集交叉污染、_last_flywheel_result 互相覆盖）、归因建议的规则→Agent 演进三段（规则版可解释可审计是 baseline 骨架）、归因阈值的正确打开方式（按自己基线分布的 P5 低尾分位校准，阈值本身可进飞轮标量调整——评估体系自校准自己的报警线）、context_precision 低的多因一果消歧（交叉指标+样本下钻；triage 分诊非诊断）、自动流程机制（lifespan→APScheduler 纯时间驱动、单周期失败次日照常触发、幂等重跑、为什么不用 LangGraph——拓扑复杂度不匹配，闭环完整后 LangGraph 才变合理）。
tags: ["飞轮管道", "APScheduler", "归因", "防重入"]
---

## Q1 · 第2轮 · 初始

手动 trigger 为什么防重入？啥意思？

context_precision	<0.5	KB 内容	标 KB 缺漏 / 补文档 这个也有可能是检索问题吧

build_suggested_actions() 三类归因建议 → 报告存 reports/eval_flywheel_*.json + 审计 flywheel.cycle 落库：这里归因建议，还可以再考虑一下（我们自动化的时候应该是通过后台agent去归因的）

这个自动流程是怎么自动起来的，如果中间暂停了，处理完之后是事件订阅吗？然后继续执行？我以为这里数据飞轮会用agent流图编排去做呢

归因阈值	faithfulness 0.7 / relevancy 0.6 / precision 0.5 / recall 0.5：阈值怎么选的？

## A1 · 第2轮

## 模块二：飞轮管道工程

### Q3 手动 trigger 防重入是什么

**重入**：同一个长任务还没跑完，又一次触发进来（术语来自操作系统 reentrant——函数执行到一半又被调用）。飞轮一轮 5-15 分钟，如果不防：

- 两个周期并发跑 → RAGAS judge LLM 调用**双倍烧钱**
- 数据集交叉污染（同一天的 session 被两个周期都提取）
- `_last_flywheel_result` 全局变量被互相覆盖

实现（`evaluation.py:799`，实测代码）：

```python
if _running_flywheel_task is not None and not _running_flywheel_task.done():
    raise HTTPException(409, "上一个飞轮周期仍在运行，请等待完成")
_running_flywheel_task = asyncio.create_task(_bg_task())
```

模块级句柄 + `done()` 检查，冲突返回 **409 Conflict**（语义就是“资源状态冲突”，不是 500）。前端轮询 `/flywheel/info` 看 `running` 字段判断能不能再触发。

### Q4 归因建议应该由后台 Agent 做——对，这是演进方向

你的直觉是对的。现状 `build_suggested_actions()` 是**规则映射**（阈值+优先级查表）。完整闭环里归因应该升级为 **Agent 归因**（spec 的 P1 层正是这么设计的——“Agent 分析低分样本+给修改建议”）。

为什么从规则起步：① 冷启动阶段规则**可解释可审计**——每条建议都有明确触发条件，出问题能定位是哪条规则误判；② 规则是 Agent 归因的 baseline 骨架。演进路线：

```
规则归因（现状）：指标低→类别映射，粗粒度、确定性
   ↓
LLM 样本级归因（P1）：把低分样本的 query/contexts/answer 喂给 LLM，
   分析具体根因（"这 3 条低分都来自同一篇文档的 chunk"），细粒度
   ↓
Agent 提议 + 边界执行：标量自动改、prompt 出建议人工确认
```

业界同构：可观测性领域的根因分析（RCA）同样从规则告警演进到 AIOps/LLM 辅助归因。面试讲法：“规则版是 v1，Agent 归因是设计中的 v2——先用可解释规则跑通闭环骨架，再把归因智能化”。

### Q5 归因阈值怎么选的

诚实回答分两层：

- **初始值来源**：经验值 + RAGAS 社区参考线（生产级 faithfulness >0.8 / relevancy >0.7 / precision >0.6 / recall >0.7）。我们阈值（0.7/0.6/0.5/0.5）**低于**参考线，原因是 KB17 同质文档 + self-judge 偏差下实测值本身偏高（faithfulness 实测 0.88-0.97）——阈值贴着参考线就全报警，失去分诊意义。
- **正确打开方式**（面试加分点）：阈值不该一次定死，应该**用自己数据的分布校准**——跑首轮基线评估，把指标分布拿出来，阈值设在低尾分位（如 P5），让“报警率”可控。而且阈值本身就可以是飞轮调整的标量参数（进 WRITABLE_CONFIGS 白名单）——**评估体系自己校准自己的报警线**，这才是闭环的完全体。检测理论里这是固定阈值 vs 分位数阈值 vs 动态基线的经典选择。

### Q6 context_precision 低也可能是检索问题——归因歧义

对，**归因是多因一果**，规则映射给的是“最可能方向”不是“因果结论”。context_precision 低的候选因：① KB 缺内容 ② 检索排序差（相关内容召回了但排后面）③ chunking 切分不当 ④ GT 标注偏差。

**怎么消歧**——这正是 Q4 的 Agent 归因价值所在：

| 消歧手段 | 逻辑 |
|---|---|
| 交叉指标 | precision 低但 **recall 高** → 内容在、排序差 → 检索侧（调 rerank/top_k）；recall 也低 → 内容可能真缺 → KB 侧 |
| 样本级下钻 | 把低分样本的 contexts 拿出来看：相关 chunk 有没有被召回？排在第几位？——LLM 归因能做这个 |
| 优先级兜底 | 规则表里 faithfulness > context_recall > context_precision 的顺序本身就是消歧次序 |

面试措辞：规则归因定位为 **triage（分诊）**而非 diagnosis（诊断）——给出排查入口，不冒充结论。诚实承认这一点比硬说“精确归因”可信得多。

### Q7 自动流程怎么自动 / 暂停了怎么办 / 为什么不用 LangGraph

**怎么自动起来**：FastAPI `lifespan`（应用启动钩子）→ `start_scheduler()` → APScheduler 的 `AsyncIOScheduler` 注册 `CronTrigger(hour=2)` → 调度器常驻事件循环，**到点自动触发**，无需外部信号。纯时间驱动，不是事件驱动。

**中间暂停/失败了**：每个周期是独立的——单周期失败只写进 `_last_flywheel_result` + 审计事件，**下一天 cron 照常触发**（调度器不因单次失败停摆）。周期内部没有断点续跑，靠**幂等重跑**兜底：`from_sessions` 按日期增量提取，重跑同一天只是覆盖同一个数据集，不产生重复副作用。

**“事件订阅继续执行”**：没有做事件驱动（如“新反馈攒够 N 条就触发”），因为样本要凑统计意义、时间驱动简单可预期——这是 YAGNI 取舍，不是没想到。

**为什么不用 Agent 流图（LangGraph）编排**——核心论据是**拓扑复杂度不匹配**：

| | 飞轮五阶段 | LangGraph 的用武之地 |
|---|---|---|
| 结构 | 线性管道：提取→GT→自评→评估→建议 | 条件分支、循环、**人审中断**、并行 fan-out |
| 依赖 | APScheduler 单依赖 | 引入 langchain 全家桶 |

现在的五阶段是直线，用状态机编排是杀鸡用牛刀。**但闭环完整做出来后 LangGraph 会变合理**：评估→归因→（人工审批中断节点）→执行→AB→判定，这是带人审中断+条件分支的状态机，LangGraph 的 `interrupt`/checkpoint 正好干这个。面试讲法：“复杂度预算花在边界设计而不是编排框架上，编排复杂度等流程拓扑真的复杂了再上”。业界同构：Airflow/Dagster（数据管道 DAG）vs Temporal（持久化工作流，支持等人审信号等几小时几天）。
