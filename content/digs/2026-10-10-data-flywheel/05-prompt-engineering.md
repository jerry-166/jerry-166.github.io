---
title: Prompt 工程与回归防线
date: 2026-10-10
order: 5
description: 第2轮模块四+第3轮追问——prompt 修改的现状与 spec 方案（模板外置到 prompt_templates 表=业界标准形态：Langfuse Prompts/PromptLayer）、为什么"永远半自动"（variables_schema 耦合消除不掉、reward hacking 风险跟存储位置无关——存储外置解决"改起来麻烦"解决不了"改坏了危险"）、与 prompt 回归集 CI 不冲突是配套（CI 提交时防线+飞轮 AB 运行时防线，一个挡上线一个挡线上）；追问：variables_schema 耦合的业界四层缓解（渲染容错/契约检查 lint/提供方注册表/DSPy 范式替换）与原理上解不了的部分（模板引用运行时不存在的信息，任何架构都无能为力；能自动化的是变更检测不是信息凭空出现）。
tags: ["Prompt 工程", "CI 回归", "DSPy"]
---

## Q1 · 第2轮 · 初始

prompt 类	generate_response / query_expansion system prompt	✗ 半自动	① 改 prompt = 改代码（f-string 变量名耦合，模板外置后新增变量仍要改调用处）② reward hacking 风险高：这里怎么去改prompt，感觉挺复杂的，只能改代码吗？会和prompt回归集CI检测撞上吗？

## A1 · 第2轮

## 模块四：Prompt 工程

### Q11 prompt 怎么改 / 只能改代码吗 / 会不会和回归 CI 撞车

**现状**：prompt 是 f-string 硬编码（`rag_workflow.py` / `rag_tools.py`），改=改代码=发版。**spec 的方案**（prompt 三层架构）就是解这个：模板外置到 DB 表 `prompt_templates(name, version, system_tpl, variables_schema, status)`——运行时按 name+version 取模板渲染，**改 prompt = 改数据库一行 = 不发版**。这是业界标准形态：Langfuse Prompts、PromptLayer、langhub 全是这个模式（模板版本化存储+运行时取用）。

**但为什么“永远半自动”**（即使外置了）：① `variables_schema` 耦合消除不掉——模板新增变量（如 `{user_role}`），调用处代码必须跟着提供这个变量，模板外置不等于解耦干净；② reward hacking 风险跟存储位置无关——DB 里的 prompt 和代码里的 prompt 一样能被改坏。**存储外置解决的是“改起来麻烦”，解决不了“改坏了危险”**。

**和 prompt 回归集 CI 的关系：不冲突，是配套**——这是这道题的亮点。prompt 版本化（v1/v2 + status）**正是**回归检测的前提：

```
CI 侧（提交时防线）：prompt 变更 → 自动跑回归集（固定 query × 新旧模板）
                    → 断言输出质量 / 关键约束还在（如"仅基于上下文"）
线上侧（运行时防线）：飞轮 AB（baseline v1 vs candidate v2）
                    + reward hacking 检测（faithfulness↑ 但 relevancy↓ → 告警）
```

一个挡上线、一个挡线上，互补。工具生态：promptfoo、OpenAI evals、Langfuse Playground 都是干 CI 侧这件事的。面试点题：“我的 AB 框架 + 检测规则就是运行时版回归集，CI 回归集是同一思想的提交时版”。

---

## Q2 · 第3轮 · 追问

但为什么“永远半自动”（即使外置了）：① variables_schema 耦合消除不掉——模板新增变量（如 {user_role}），调用处代码必须跟着提供这个变量，模板外置不等于解耦干净；这个问题业界就没有什么处理方式吗？虽然我觉得这个可能确实不好处理，但可能就有能人可以去重构一个架构，然后就能保证这个 prompt 的自动化

## A2 · 第3轮

## 2. variables_schema 耦合，业界真的没有解法吗？

有解法，但分**能解的部分**和**原理上解不了的部分**，分开说：

**业界四层缓解**：

| 层 | 做法 | 效果 |
|---|---|---|
| 渲染容错 | Jinja2 `{{ user_role \| default("") }}`，缺失变量降级渲染不炸 | 把 KeyError 变成缺省值 |
| 契约检查 | 模板平台 lint：variables_schema 声明 vs 渲染调用点静态分析对账，CI 红灯 | 把**运行时故障**变成**提交时报警** |
| 提供方注册表 | 变量提供器注册（“user_role 由 auth 中间件提供”），渲染器按需拉取，调用处不用改 | 变量获取逻辑收敛到一处 |
| 范式替换 | **DSPy**：不再手写模板——声明 signature（输入/输出字段语义），prompt 由编译器生成和优化（MIPRO 算法），变量集合=函数签名，编译期类型检查 | 这是最接近“prompt 自动化”的路线 |

**原理上解不了的部分**：模板引用一个**运行时根本不存在的信息**（user_role 从未被采集、注册表里也没有这个提供器）——信息不存在，任何架构都变不出来。架构能自动化的是“**变更的安全检测**”，不能自动化“**信息凭空出现**”。

所以你的直觉对了一半：确实不好处理，但不是绝对无解——业界的现实共识是**把摩擦从运行时挪到编译期**（lint + 回归集），而彻底的自动化要走 DSPy 那样的范式替换。但注意：**即便上了 DSPy，reward hacking 风险依然独立存在**（它跟存储方式、耦合方式都无关）——所以 prompt 半自动的第一理由始终是风险，耦合只是叠加的工程摩擦。主流平台（promptfoo/Langfuse）最终都收敛到“版本化+回归集+人工审批”，没有一个做全自动 prompt 修改，这就是业界用脚投票的答案。

---
