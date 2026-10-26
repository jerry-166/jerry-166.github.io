// 站点配置
export const siteConfig = {
  name: 'Jerry\'s Blog',
  title: '墨染秋毫',
  description: '探索AI与RAG的世界，记录成长的每一步',
  author: 'Jerry',
  // 简短的个人签名
  motto: '道阻且长，行则将至',
  // 部署域名（用于 SEO metadataBase / sitemap）
  url: 'https://jerry-166-github-io-juuy.vercel.app',
}

// 教程手册系列（静态 HTML 手册，部署在 /public/books 下，按 category 分组展示）
export type BookCategory = 'frontend' | 'backend' | 'java'

export interface TutorialBook {
  title: string
  volume: string
  description: string
  href: string
  tags: string[]
  accent: string // 卡片左侧强调色（水墨风低饱和色）
  category: BookCategory
}

// 手册分类分组（项目页按此顺序渲染成多个专栏）
export const bookCategories: { key: BookCategory; label: string }[] = [
  { key: 'frontend', label: '前端系列' },
  { key: 'backend', label: 'Python / 后端系列' },
  { key: 'java', label: 'Java 系列' },
]

export const tutorialBooks: TutorialBook[] = [
  {
    title: '前端入门到进阶路线',
    volume: '总纲',
    description:
      '为零基础、有后端功底的学习者定制的路线图：每个知识点标注优先级与记忆层级，先跑起来、再懂原理、最后谈架构。',
    href: '/books/frontend-roadmap/frontend-roadmap.html',
    tags: ['路线图', '学习规划'],
    accent: '#7d9a76',
    category: 'frontend',
  },
  {
    title: '概念与最小代码手册 · 第一册',
    volume: '卷一',
    description:
      '细化路线图 Stage 0-2：HTML 标签大全、CSS 核心概念（flex 逐属性讲）、DOM 与事件、JS 核心语法，全部配套可直接运行的最小代码。',
    href: '/books/frontend-handbook-1/frontend-handbook-1.html',
    tags: ['HTML', 'CSS', 'JavaScript'],
    accent: '#a8823c',
    category: 'frontend',
  },
  {
    title: '第一册 · 答疑手册',
    volume: '卷一附',
    description:
      '逐条解决第一册的全部疑问：先判定（答对 / 记反 / 需补充）再讲透，17 个可交互演示覆盖优先级、BFC、事件循环、XSS 等难点。',
    href: '/books/frontend-handbook-1/qa-vol1.html',
    tags: ['答疑', '交互演示'],
    accent: '#8b6ea8',
    category: 'frontend',
  },
  {
    title: 'React 概念手册 · 第二册',
    volume: '卷二',
    description:
      '从三件套手工操作 DOM 切换到 React：你只管数据，DOM 交给它。白话讲透 + 最小代码 + 页面上能玩的交互演示。',
    href: '/books/frontend-handbook-2/frontend-handbook-2.html',
    tags: ['React', '组件化'],
    accent: '#4a8bb5',
    category: 'frontend',
  },
  {
    title: 'AI 时代前端知识金字塔',
    volume: '顶层',
    description:
      '以架构师视角组织的学习地图：从全网主流前端体系中抽取「原理、架构与判断」层——顶层必须内化，底层果断委托给 AI。',
    href: '/books/frontend-knowledge-pyramid/frontend-knowledge-pyramid.html',
    tags: ['知识体系', '架构'],
    accent: '#b5705c',
    category: 'frontend',
  },
  {
    title: 'MySQL 架构逻辑链',
    volume: '后端',
    description:
      '从 0 到 1 串讲 MySQL 架构的完整逻辑链：四层框架 → InnoDB 内存 / 磁盘两翼深挖 → 一条 update SQL 收束。含 9 张 SVG 图解、纠错卡片与面试口播稿。',
    href: '/books/mysql-arch-logic/mysql-arch-logic.html',
    tags: ['MySQL', 'InnoDB', '面试串讲'],
    accent: '#6d63c9',
    category: 'backend',
  },
  {
    title: 'FastAPI 从 0 到 1 · 原理与面试全解',
    volume: '后端',
    description:
      '从原理到使用完整串讲 FastAPI：ASGI/WSGI 契约、选型对比、请求生命周期、依赖注入双阶段、async/def 双模陷阱、性能四大件与 Rust 重写、多进程 worker 模型，附 trace_id 审计实战（rag-for-qw 源码级核实）与 Spring Boot 逐维度对比。',
    href: '/books/fastapi-interview-notes/fastapi_interview_notes.html',
    tags: ['FastAPI', 'Python', '面试', 'Spring Boot'],
    accent: '#0E9F74',
    category: 'backend',
  },
  {
    title: 'Python 内存泄漏排查 · LeakLab 实战',
    volume: '后端',
    description:
      '一个被 OOM 杀过 7 次的靶场服务，从 0 到 1 走完「发现泄漏 → 分流定性 → 定位到代码行 → memray 抓到现行 → 事故复盘」全链路：5 种泄漏形态、Docker 一键搭建、Prometheus/Grafana 面板判读、tracemalloc 预埋与线上 attach 取证，全部来自真实运行数据，配套开源仓库可复现。',
    href: '/books/python-memory-leak-lab/tutorial.html',
    tags: ['Python', '内存泄漏', 'Docker', '可观测性'],
    accent: '#8a3b3b',
    category: 'backend',
  },
  {
    title: '高并发抢购系统 · 从 0 到 1 工程级设计',
    volume: '后端',
    description:
      '面向面试的系统设计全解：容量估算用数字推导架构 → 五层漏斗（接入/资格/核心链路/数据/治理）逐层拆解 → Redis Lua 扣库存、库存分段与用户闸门、本地消息表 + MQ 异步落库 → 对账守恒式、降级预案与 V1→V5 演进路线，附 30 秒面试话术与追问深挖（单 Key 分段、延迟双删 vs binlog、分段三代价缓解）。',
    href: '/books/seckill-system-design/seckill-system-design.html',
    tags: ['系统设计', '高并发', 'Redis', 'MQ'],
    accent: '#2d7d8f',
    category: 'backend',
  },
  {
    title: '实时协同编辑全解 · 锁 → OT → CRDT → AI 并发',
    volume: '后端',
    description:
      '以「插队队伍」大白话比喻贯穿全篇讲透协作编辑：锁为何答非所问、OT 变换函数与 TP1/TP2（含可手工复算的反例）、Jupiter/Wave 生产级架构、COT 的三重代价、CRDT 七版演化（WOOT→RGA→Yjs→Fugue→Eg-walker）与元数据瘦身、飞书/Figma 同步引擎、AI 并发编辑四实践；附 22 条比喻词典、16 条事实核查表与面试作答模板，配套同目录交互实验台（4 个可动手实验复刻历史失败现场）。',
    href: '/books/collab-ot-crdt/collab_ot_crdt_tutorial.html',
    tags: ['OT', 'CRDT', '分布式', '面试'],
    accent: '#4f8f7b',
    category: 'backend',
  },
  {
    title: 'Python 八股教程书 · 三册合一（架构与内存 / 面向对象 / 并发编程）',
    volume: '合卷',
    description:
      '三册合一：架构与内存模型 + 面向对象编程 + 并发编程。97 个目录链接跨册直达（b1-/b2-/b3- 前缀锚点），6 张 SVG 机制图、38 组代码、41 张表格；每册自带比喻词典、面试速答卡与事实核查表。适合打印级通读与面试前总复习。',
    href: '/books/python-bagu-books/full.html',
    tags: ['Python', '面试', '合卷', '总复习'],
    accent: '#8f4f7f',
    category: 'backend',
  },
  {
    title: 'Java 复习手册 · 秋招面试向',
    volume: 'Java',
    description:
      '以 JVM 内存模型为地基的体系化 Java 复习：栈/堆/方法区 → 基础语法与值传递 → 面向对象（初始化顺序、equals/hashCode 分桶）→ 集合框架（HashMap put 全流程、ConcurrentHashMap）→ JVM 深入（类加载、GC 三色标记、内存泄漏排查）。面试高频与易错点全程标注，内置划线批注 + 云端同步。',
    href: '/books/java-review/index.html',
    tags: ['Java', 'JVM', '集合', '面试'],
    accent: '#2456d6',
    category: 'java',
  },
  {
    title: '算法面试语言对照手册 · Java × Python',
    volume: 'Java',
    description:
      '以 19 道 LeetCode 高频题为载体的双栏对照手册：字符串/哈希/数组/栈队列/堆/排序比较器/二分/链表树/数字溢出逐章拆解，每题并排 Java 与 Python 写法、对比要点与追问预案。附 Python 标准库武器速查（Counter/bisect/itertools 及禁库退化版）、Java 八大翻车点清单（== 陷阱、Integer 缓存、CME）、ACM 模式输入输出模板，以及 28 问自测清单（勾选进度自动保存）。',
    href: '/books/java-python-algo-compare/java-python-algo-compare.html',
    tags: ['Java', 'Python', 'LeetCode', '算法'],
    accent: '#b0712a',
    category: 'java',
  },
  {
    title: '权限体系・从页面级 RBAC 到 Casbin/OPA',
    volume: '后端',
    description:
      '一道页面级 RBAC 面试题贯穿的五层权限教程：三层权限（功能/行级/字段）与 ACL→RBAC→ABAC→PBAC/OPA→ReBAC 演进 → 若依自研（sys_menu 双重身份、M/C/F/I、data_scope 五档、Jackson 字段级）→ Casbin（PERM 模型、EAV 表、RoleManager 可达性、Adapter/Watcher、行级两路线）→ OPA（Rego、PEP/PDP/PIP/PAP、Bundle 热更新、部分求值 SQL 下推）→ 全维度对比、Redis Set 缓存、完整术语表与 30 秒/3 分钟面试口述稿。',
    href: '/books/rbac-permission-handbook/index.html',
    tags: ['RBAC', '权限', 'Casbin', 'OPA', '面试'],
    accent: '#3b4f8a',
    category: 'backend',
  },
  {
    title: '连接的进化 · HTTP → HTTPS → SSE → WebSocket → MCP',
    volume: '后端',
    description:
      '以「连接自由度不断提高」为主线串讲五代协议演进：HTTP 请求-响应模型（TCP 三次握手、报文结构、1.0→3.0 版本演进与三大结构缺陷）→ HTTPS 给 HTTP 上锁（TLS 1.2 逐步握手时序、1.3 的 1-RTT 与前向保密、密码学三件套、证书链与常见攻击）→ SSE 让服务器开口（三种轮询对比、text/event-stream 事件格式、自动重连续传）→ WebSocket 全双工（101 升级握手、帧结构、心跳与优雅关闭）→ MCP 为 AI 定义连接的标准语言（Host/Client/Server 架构、JSON-RPC 2.0、stdio 与 Streamable HTTP 选型、Tools/Resources/Prompts 三原语、与 Function Calling 互补不替代、安全边界与工程实践），全程配可逐步播放的交互时序图，附面试实战「了解过 MCP 吗」一整段话回答（11 个知识钩子可点击跳转对应章节）。',
    href: '/books/network-protocol/network-protocol.html',
    tags: ['HTTP', 'HTTPS', 'WebSocket', 'MCP', '面试'],
    accent: '#4a6fa5',
    category: 'backend',
  },
]

// 玩物志：AI 协作创作的闲趣小件（静态交互页面，部署在 /public/playground 下）
// 「玩物丧志」的反转——不追求实用，只为好玩；每件都是可直接在线把玩的单文件作品
export interface PlaygroundItem {
  title: string
  edition: string // 期号（呼应作品的系列编号）
  description: string
  href: string
  tags: string[]
  accent: string // 卡片左侧强调色
  cover: string // 封面图路径（public 下）
}

export const playgroundItems: PlaygroundItem[] = [
  {
    title: '慢慢骑 · Pelican Sunday',
    edition: 'Nº 001',
    description:
      '鹈鹕先生的周日沿海骑行：纯 SVG + 原生 JS 动态插画，零依赖单文件。90 秒日夜循环（天色插值、日月升落、星夜渐显），车轮曲柄与双腿运动学联动，Web Audio 合成八音盒配乐与车铃，支持 prefers-reduced-motion 无障碍。',
    href: '/playground/pelican-sunday/index.html',
    tags: ['SVG 动画', 'Web Audio', '单文件'],
    accent: '#df653f',
    cover: '/playground/pelican-sunday/cover.png',
  },
]

// 作品精选轮播（项目展示页顶部，图片位于 public/showcase/）
export interface ShowcaseItem {
  src: string
  title: string
  subtitle: string
}

export const showcaseItems: ShowcaseItem[] = [
  {
    src: '/showcase/rag_pipeline.jpg',
    title: 'RAGFlow 智能知识库',
    subtitle: '文档处理流水线：PDF 解析 → 分块 → 子问题/摘要 → 向量化导入 Milvus，全流程可视化',
  },
  {
    src: '/showcase/rag_retrieval.jpg',
    title: 'RAGFlow 智能知识库',
    subtitle: '向量 / BM25 / 混合（RRF + Rerank）多策略检索，检索管道逐级可视化',
  },
  {
    src: '/showcase/rag_agent.jpg',
    title: 'RAGFlow 智能知识库',
    subtitle: 'AI Agent 问答带引用来源与相似度评分，SSE 流式输出',
  },
  {
    src: '/showcase/rag_agent_compare.jpg',
    title: 'RAGFlow 智能知识库',
    subtitle: '多 Agent 对比模式：Simple / Advanced / Claw 并行回答同一问题',
  },
  {
    src: '/showcase/liyuan_menu.jpg',
    title: '梨园生死',
    subtitle: 'AI Agent 驱动的 2D 开放探索叙事游戏，每一局都是独一无二的故事',
  },
  {
    src: '/showcase/liyuan_stage.jpg',
    title: '梨园生死',
    subtitle: '江南小镇六大子场景实机画面：破败戏台、祠堂、茶馆、码头……',
  },
  {
    src: '/showcase/liyuan_ending.jpg',
    title: '梨园生死',
    subtitle: '结局由整局关系累积塑造，每个 NPC 获得专属终章',
  },
  {
    src: '/showcase/gold_home.jpg',
    title: '每日金价早报',
    subtitle: '自动化金价资讯系统：今日金价 + 昨夜大事，大白话解读',
  },
  {
    src: '/showcase/gold_trend.jpg',
    title: '每日金价早报',
    subtitle: '伦敦金走势与关键事件一一对应，看清每次涨跌背后的宏观逻辑',
  },
  {
    src: '/showcase/blog_home.jpg',
    title: '墨染秋毫（本站）',
    subtitle: '古风淡雅的 Next.js 14 博客，杂志式首页布局',
  },
  {
    src: '/showcase/blog_projects.jpg',
    title: '墨染秋毫（本站）',
    subtitle: '教程手册 / 玩物志 / 开源项目分栏展示',
  },
]

// 笔试复盘考点体系（/exams 模块）
// 顺序即考点视图的分组顺序：四大件（计算机基础）在前，语言/领域类扩展在后。
// 不在此列表中的新考点（如「组成原理」「图形学」）会自动排在已知考点之后，
// 按题数、名称排序——引入新考点无需改任何代码，直接写进 md 的 questions 即可。
export const examTopicOrder: string[] = [
  // —— 四大件 ——
  '操作系统',
  '计算机网络',
  '数据结构与算法',
  '数据库',
  // —— 扩展考点 ——
  'Java',
  'Python',
  '前端',
  '大模型',
  'AI Coding',
  '游戏',
  '其他',
]

// 导航链接
export const navLinks = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/exams', label: '笔试' },
  { href: '/digs', label: '深挖' },
  { href: '/books', label: '教程' },
  { href: '/playground', label: '玩物志' },
  { href: '/projects', label: '项目' },
  { href: '/about', label: '关于' },
]

// 个人链接
export const socialLinks = {
  github: 'https://github.com/jerry-166',
  email: '2132049351@qq.com',
}
