---
company: 途虎养车
date: 2026-08-30
title: 途虎养车笔试复盘
description: 10 道客观题、优惠券编程题与 AI Coding 复盘
questions:
  # —— 客观题 ——
  - title: 第 1 题：Java 重载
    topic: Java
    type: 客观题
    section: 判定总览
  - title: 第 2 题：CSS 层叠上下文的判断边界
    topic: 前端
    type: 客观题
  - title: 第 3 题：自动拆箱 NPE
    topic: Java
    type: 客观题
    section: 判定总览
  - title: 第 4 题：script、async、defer 的时序
    topic: 前端
    type: 客观题
  - title: 第 5 题：SQL LIKE
    topic: 数据库
    type: 客观题
    section: 判定总览
  - title: 第 6 题：单链表删除
    topic: 数据结构与算法
    type: 客观题
    section: 判定总览
  - title: 第 7 题：网络分层
    topic: 计算机网络
    type: 客观题
    section: 判定总览
  - title: 第 8 题：Linux 权限 754
    topic: 操作系统
    type: 客观题
  - title: 第 9 题：大模型常见解码参数
    topic: 大模型
    type: 客观题
  - title: 第 10 题：训练阶段
    topic: 大模型
    type: 客观题
    section: 判定总览
  # —— 编程题 ——
  - title: 编程题：优惠券最优选择
    topic: 数据结构与算法
    type: 编程题
  # —— AI Coding ——
  - title: AI Coding 复盘建议
    topic: AI Coding
    type: AI Coding
  # —— 考后深挖 ——
  - title: 考后深挖：浏览器脚本加载时序
    topic: 前端
    type: 深挖
  - title: 考后深挖：Linux 文件身份与权限位
    topic: 操作系统
    type: 深挖
  - title: 考后深挖：大模型解码采样流程
    topic: 大模型
    type: 深挖
  - title: 考后深挖：CSS 层叠上下文实例
    topic: 前端
    type: 深挖
---

## 判定总览

10 道客观题的结论速查，重点标出 async/defer、Linux 权限、大模型解码参数和 CSS 层叠上下文。

| 题号 | 考点 | 结论 | 关键原因 |
|---|---|---|---|
| 1 | Java 重载 | 正确 | 101 编译期是 int；基本类型拓宽 int→long 优先于装箱为 Integer |
| 2 | CSS 层叠 | 部分正确 | transform 会创建层叠上下文；子元素 z-index 只在该上下文内比较，不能拿内部 9999 和外部 1 直接比 |
| 3 | 自动拆箱 NPE | 待确认 | 题目记录只说明考点是自动拆箱 NPE，未记录所选答案；包装类型为 null 时转基本类型会触发 NPE |
| 4 | async/defer | 错误 | 下载后立即执行、可能打断解析的是 async；defer 在 HTML 解析完成后按顺序执行 |
| 5 | SQL LIKE | 正确 | `%` 匹配 0 个或多个字符，`_` 匹配恰好 1 个字符 |
| 6 | 单链表删除 | 正确 | `p.next = p.next.next` 删除的是 p 后面的节点，前提是 p 和 p.next 均非空 |
| 7 | 网络分层 | 正确 | IP 属于网络层；MAC 寻址/帧属于数据链路层 |
| 8 | Linux 权限 | 待确认 | 题目记录未给所选答案；`chmod 754 myfile` 表示 rwxr-xr-- |
| 9 | 解码参数 | 部分正确 | Top K 理解正确；Temperature 不是输出频率，Top P 是按累计概率动态截断候选 token |
| 10 | 训练阶段 | 正确 | 预训练 → SFT → 对齐训练；RLHF 是“基于人类反馈的强化学习” |

## 重点题详解

### 第 4 题：script、async、defer 的时序

- 普通脚本：HTML 解析走到脚本标签后，需要等待脚本下载并执行，随后才能继续解析后续 HTML。
- async：HTML 解析与脚本下载并行；**下载完立即执行**，执行时可能打断 HTML 解析，多个 async 脚本执行顺序不确定。
- defer：HTML 解析与脚本下载并行；**HTML 解析完成后**、`DOMContentLoaded` 之前按出现顺序执行。

记忆：**async 无序、下载完就执行；defer 有序、解析完再执行。**

### 第 8 题：Linux 权限 754

数字怎么来：r = 4，w = 2，x = 1，允许的权限相加。r-x = 4+1 = 5，r-- = 4。

- 7 = rwx：属主读/写/执行
- 5 = r-x：属组读/执行
- 4 = r--：其他人只读

```bash
chmod 754 myfile
# 权限字符串：rwxr-xr--
# 若文件名真的含空格：chmod 754 "my file"
```

### 第 9 题：大模型常见解码参数

生成流程：

1. 模型输出 logits：每个候选 token 一个原始分数。
2. Temperature：缩放 logits 后做 softmax，得到概率分布。低温更确定，高温更随机。
3. Top K：只保留概率最高的 K 个 token，再重新归一化并采样。
4. Top P：按概率从高到低累加，保留累计概率刚达到 P 的最小集合。
5. 采样 / 贪婪：采样按概率随机抽；Greedy 每步只取概率最高的 1 个。

三个辨析：

- **Greedy Decoding**：每一步都选当前概率最大的 token，结果确定，但容易重复、陷入局部最优。Temperature 趋近 0 时近似贪婪。
- **Top K 与 RAG Top K 的区别**：生成阶段 Top K 筛选候选 token；RAG Top K 检索最相关的 K 段文档。两者都是“取前 K 个”，但作用阶段和对象不同。
- **Top P 例子**：token 概率依次为 0.55、0.25、0.15、0.05，Top P = 0.9 时保留前三个（累计 0.95 是刚达到 0.9 的最小集合），候选数量随分布动态变化。

### 第 2 题：CSS 层叠上下文的判断边界

- transform 会让元素 A 创建新的层叠上下文；若 A 没有有效 z-index，它作为整体参与外部排序。
- A 内部的 `z-index: 9999` 只在 A 的内部上下文里领先，**不能“穿透”到外部直接压过 B**。
- 若 B（z-index: 1）与 A 是兄弟节点，真正比较的是 A、B 在外部上下文里的层级，还要看 B 是否定位、z-index 是否生效。
- 结论：没有完整 HTML/CSS 时不能断言覆盖关系；“独立层叠、无法直接比较”抓住了关键，但还需确认 A/B 自身的 position、z-index 和 DOM 嵌套关系。

## 编程题：优惠券最优选择

### 题意

- 优惠券信息：包含面额、类型、扣减价值以及使用门槛（题目记录未给字段名，下文用 `threshold` 表示门槛，用 `discount_value` 表示实际扣减价值）。
- 商品信息：包含类型、价值和个数。
- 特殊类型 `all`：所有商品金额都计入门槛。
- 目标：在可使用的优惠券中，选择实际优惠力度最大的一张；优惠力度相同时，返回 ID 字典序更小的优惠券。

### 思路

1. 遍历商品，按类型聚合商品总金额，得到哈希表。
2. 计算所有商品的总金额，供 `all` 类型优惠券使用。
3. 遍历优惠券：普通类型对比该类型小计，`all` 类型对比全部商品总计。
4. 若商品金额达到优惠券门槛，则该券可用。
5. 比较实际扣减价值；扣减价值相同时比较 ID 字典序。

### 代码（Python，可直接运行）

```python
from collections import defaultdict


def best_coupon(coupons, products):
    # 按商品类型汇总金额：单价 value × 个数 count
    totals = defaultdict(float)
    for product in products:
        totals[product["type"]] += product["value"] * product["count"]

    grand_total = sum(totals.values())
    best_id = None
    best_discount = None

    for coupon in coupons:
        # all 类型对比全部商品总计；普通类型只对比对应类型小计
        if coupon["type"] == "all":
            base_total = grand_total
        else:
            base_total = totals.get(coupon["type"], 0)

        # 未达到使用门槛，优惠券不可用
        if base_total < coupon["threshold"]:
            continue

        discount = coupon["discount_value"]
        coupon_id = coupon["id"]

        # 优惠金额更大；或金额相同时 ID 字典序更小
        if (
            best_id is None
            or discount > best_discount
            or (discount == best_discount and coupon_id < best_id)
        ):
            best_id = coupon_id
            best_discount = discount

    return best_id


# 示例：food 小计 20，book 小计 15，全部商品总计 35
products = [
    {"type": "food", "value": 10, "count": 2},
    {"type": "book", "value": 15, "count": 1},
]

coupons = [
    {"id": "C1", "type": "food", "threshold": 20, "discount_value": 5},
    {"id": "C2", "type": "all", "threshold": 30, "discount_value": 6},
    {"id": "C3", "type": "book", "threshold": 20, "discount_value": 8},
]

print(best_coupon(coupons, products))  # C2：C3 门槛不满足，C2 比 C1 优惠更大
```

### 复杂度

- 时间复杂度：商品汇总 O(P)，优惠券遍历 O(C)，总体 O(P+C)。
- 空间复杂度：O(T)，T 是商品类型数。

### 边界

- 不存在对应类型商品。
- 商品金额刚好等于优惠券门槛。
- 多张优惠券优惠金额相同，需要按 ID 字典序选择。
- 商品个数为 0、商品列表为空、优惠券列表为空。
- 若优惠是折扣比例而非固定面额，比较值应先换算成“实际可减免金额”，不能只比较券面数字。

## AI Coding 复盘建议

### 实际过程记录

- AI Coding 得分：8621 / 8888。
- 分成两个会话：主会话负责分布式写代码；评估后认为任务不能并行，于是改为串行写代码。
- 次会话负责完善测试脚本，只读 README。
- 测试完成后进入 bug 修复阶段：主会话做了一轮修复，又新开会话做了一轮修复。
- 最终分数仍停留在 8621，未继续处理。

### 复盘建议

- 串行写代码的判断可能是对的，但前提是任务之间真的有依赖；工具类、纯函数、独立测试仍可并行。
- 次会话只读 README、补测试是合理隔离，避免测试脚本被实现思路污染。
- 分数卡住时，新开会话不是关键；关键是拿到失败用例、实际输出与期望输出的最小差异，再定位边界条件。
- 优先补：空输入、单元素、重复类型、门槛等于总计、all 券、同优惠金额 ID 比较、异常输入。

## 考后深挖：浏览器脚本加载时序

### 浏览器加载页面的大致流程

```text
下载 HTML
→ 解析 HTML，构建 DOM
→ 下载并解析 CSS，构建 CSSOM
→ 合并成渲染树
→ 布局 Layout
→ 绘制 Paint
```

页面不一定等所有资源都准备好才一次性渲染，而可能边解析、边渲染。

HTML 解析器遇到普通外部脚本时，需要暂停后续 HTML 解析，因为脚本可能修改 DOM、CSS 或调用 `document.write()`。现代浏览器的预加载扫描器可能提前发现脚本并在后台下载，但脚本执行前后的解析时机仍然受阻塞规则约束。

CSS 通常不阻塞 HTML 解析，但会阻塞渲染；如果 JS 前面有尚未加载解析完的 CSS，JS 执行也可能等待 CSS，因为 JS 可能读取样式。

### 三种脚本对比

| 类型 | 下载时是否继续解析 HTML | 执行时机 | 是否可能阻塞解析 | 执行顺序 |
|---|---|---|---|---|
| 普通脚本 | 解析器走到标签后等待；现代浏览器可能预下载 | 下载完立刻执行 | 会阻塞 | 按标签顺序 |
| async | 继续解析，后台并行下载 | 谁下载完谁立刻执行 | 执行时可能阻塞 | 顺序不确定 |
| defer | 继续解析，后台并行下载 | HTML 解析完后、DOMContentLoaded 前执行 | 不阻塞 HTML 解析 | 严格按标签顺序 |

### 使用场景

- 普通脚本：必须在页面后续解析前运行的关键脚本，或放在 `</body>` 前等待主要 DOM 就绪的脚本。
- async：完全独立、没有依赖、执行顺序不重要的脚本，如访问统计、埋点 SDK、广告脚本。
- defer：需要操作 DOM、多个脚本有依赖、希望后台下载但不阻塞页面解析的业务脚本。

注意：`async` 和 `defer` 主要用于外部脚本；内联脚本没有下载过程，会立即执行。ES module 默认类似 defer，加 async 后会在下载完成后尽快执行。

## 考后深挖：Linux 文件身份与权限位

### 属主、属组、其他人

每个文件都有三类访问身份：

- 属主 owner：拥有这个文件的用户。通常创建者默认是属主，但 root 可以通过 `chown` 修改。
- 属组 group：拥有这个文件的用户组。一个用户可以属于一个或多个组。
- 其他人 others：既不是属主、也不属于属组的用户。

例如：

```bash
ls -l app.sh
# -rwxr-xr-- 1 alice dev ... app.sh
```

表示属主是 `alice`，属组是 `dev`。

权限匹配只会选择一组，不会叠加：

1. 当前用户是属主，使用 owner 权限。
2. 否则当前用户在属组中，使用 group 权限。
3. 否则使用 others 权限。

常用查看命令：

```bash
id
groups
groups alice
```

### 754 的完整含义

权限数字按 r、w、x 权重相加：

- r = 4，读
- w = 2，写
- x = 1，执行

```text
rwx r-x r--
 7   5   4
```

- 属主：rwx，可读、可写、可执行。
- 属组：r-x，可读、可执行，不可写。
- 其他人：r--，只能读。

目录权限与文件权限含义不同：

- 文件 x：可执行。
- 目录 r：可以列出目录内容。
- 目录 w：可以在目录内新建、删除、重命名目录项。
- 目录 x：可以进入或穿越该目录，访问其中已知路径的文件。

## 考后深挖：大模型解码采样流程

### 标准流程

常见采样链路是：

```text
模型输出 logits
→ Temperature 缩放
→ softmax 得到概率
→ Top K 过滤
→ Top P 过滤
→ 对剩余概率重新归一化
→ 按概率采样
```

不同框架顺序可能略有差异，Hugging Face 等常见实现通常是 temperature → top_k → top_p。

### Temperature

Temperature 不是“输出频率”，也不是最终随机抽样器。它改变概率分布的尖锐或平滑程度：

```text
softmax(logits / Temperature)
```

- 低温（如 0.2）：高概率 token 概率更高，输出更确定、保守。
- T = 1：使用模型原始概率分布。
- 高温（如 1.2）：概率分布更平滑，低概率 token 更容易出现，随机性更强。
- T 趋近 0：效果近似贪婪解码。

温度是调用模型时设置的超参数，不是模型运行时随机决定的。

### Top K

假设概率分布为：

```text
A：0.60
B：0.25
C：0.10
D：0.04
E：0.01
```

Top K = 3 时，只保留 A、B、C，再把三者概率重新归一化，D、E 完全没有机会被选中。

### Top P

Top P（nucleus sampling，核采样）按概率从高到低累加，保留累计概率第一次达到或超过 P 的最小集合。

上例中：

```text
A             = 0.60
A + B         = 0.85
A + B + C     = 0.95
A+B+C+D       = 0.99
全部           = 1.00
```

Top P = 0.9 时保留 A、B、C；Top P = 0.6 时只保留 A。Top P 的候选数量随分布动态变化，Top K 的候选数量固定。

### 采样与贪婪

过滤后，采样器按概率做加权随机抽签。例如 A=0.70、B=0.20、C=0.10，不是三者等概率随机，而是约 70% 概率抽到 A。

Greedy Decoding 不做随机抽签，每一步直接取概率最高的 token，结果确定，但容易重复、保守或陷入局部最优。

## 考后深挖：CSS 层叠上下文实例

可以把层叠上下文理解成“包厢”：子元素的 z-index 只在包厢内部排队；包厢整体如果在外部输了，包厢里的所有子元素会一起被外部元素压住。

### 情况 1：A 没有创建层叠上下文

```css
.baggage {
  position: relative;
  z-index: 9999;
}

.b {
  position: relative;
  z-index: 1;
}
```

如果 A 没有 transform、opacity < 1、filter 等创建层叠上下文的属性，baggage 和 B 在同一个根层叠上下文里比较，9999 大于 1，baggage 盖住 B。

### 情况 2：A 有 transform，但 A 自己没有正 z-index

```css
.a {
  position: absolute;
  transform: translateX(0);
  z-index: auto;
}

.baggage {
  position: relative;
  z-index: 9999;
}

.b {
  position: absolute;
  z-index: 1;
}
```

transform 让 A 创建新的层叠上下文，baggage 的 9999 只在 A 内部有效。外部比较时 A 约为 auto/0，B 是 1，因此 B 盖住 A 的整个子树，包括 baggage。

### 情况 3：A 有 transform，同时 A 自己 z-index 为 2

```css
.a {
  position: absolute;
  transform: translateX(0);
  z-index: 2;
}

.baggage {
  position: relative;
  z-index: 9999;
}

.b {
  position: absolute;
  z-index: 1;
}
```

外部比较结果是 A(2) 大于 B(1)，A 的整个子树都在 B 上面，因此 baggage 也显示在 B 上面。

### 情况 4：B 的 z-index 没生效

如果 B 是默认的 `position: static`，普通静态元素上的 z-index 默认不生效。即使写了 `z-index: 1`，也可能被定位且设置 z-index 的 baggage 盖住。

判断顺序：

1. 先看 z-index 是否生效。
2. 再看父元素是否创建层叠上下文。
3. 子元素先在父级内部比较。
4. 父级整体输了，子级 z-index 再大也一起输。
