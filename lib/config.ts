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
    title: 'Java 复习手册 · 秋招面试向',
    volume: 'Java',
    description:
      '以 JVM 内存模型为地基的体系化 Java 复习：栈/堆/方法区 → 基础语法与值传递 → 面向对象（初始化顺序、equals/hashCode 分桶）→ 集合框架（HashMap put 全流程、ConcurrentHashMap）→ JVM 深入（类加载、GC 三色标记、内存泄漏排查）。面试高频与易错点全程标注，内置划线批注 + 云端同步。',
    href: '/books/java-review/index.html',
    tags: ['Java', 'JVM', '集合', '面试'],
    accent: '#2456d6',
    category: 'java',
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
