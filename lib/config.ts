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

// 前端教程系列（静态 HTML 手册，部署在 /public/books 下）
export interface TutorialBook {
  title: string
  volume: string
  description: string
  href: string
  tags: string[]
  accent: string // 卡片左侧强调色（水墨风低饱和色）
}

export const tutorialBooks: TutorialBook[] = [
  {
    title: '前端入门到进阶路线',
    volume: '总纲',
    description:
      '为零基础、有后端功底的学习者定制的路线图：每个知识点标注优先级与记忆层级，先跑起来、再懂原理、最后谈架构。',
    href: '/books/frontend-roadmap/frontend-roadmap.html',
    tags: ['路线图', '学习规划'],
    accent: '#7d9a76',
  },
  {
    title: '概念与最小代码手册 · 第一册',
    volume: '卷一',
    description:
      '细化路线图 Stage 0-2：HTML 标签大全、CSS 核心概念（flex 逐属性讲）、DOM 与事件、JS 核心语法，全部配套可直接运行的最小代码。',
    href: '/books/frontend-handbook-1/frontend-handbook-1.html',
    tags: ['HTML', 'CSS', 'JavaScript'],
    accent: '#a8823c',
  },
  {
    title: '第一册 · 答疑手册',
    volume: '卷一附',
    description:
      '逐条解决第一册的全部疑问：先判定（答对 / 记反 / 需补充）再讲透，17 个可交互演示覆盖优先级、BFC、事件循环、XSS 等难点。',
    href: '/books/frontend-handbook-1/qa-vol1.html',
    tags: ['答疑', '交互演示'],
    accent: '#8b6ea8',
  },
  {
    title: 'React 概念手册 · 第二册',
    volume: '卷二',
    description:
      '从三件套手工操作 DOM 切换到 React：你只管数据，DOM 交给它。白话讲透 + 最小代码 + 页面上能玩的交互演示。',
    href: '/books/frontend-handbook-2/frontend-handbook-2.html',
    tags: ['React', '组件化'],
    accent: '#4a8bb5',
  },
  {
    title: 'AI 时代前端知识金字塔',
    volume: '顶层',
    description:
      '以架构师视角组织的学习地图：从全网主流前端体系中抽取「原理、架构与判断」层——顶层必须内化，底层果断委托给 AI。',
    href: '/books/frontend-knowledge-pyramid/frontend-knowledge-pyramid.html',
    tags: ['知识体系', '架构'],
    accent: '#b5705c',
  },
]

// 导航链接
export const navLinks = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/projects', label: '项目' },
  { href: '/about', label: '关于' },
]

// 个人链接
export const socialLinks = {
  github: 'https://github.com/jerry-166',
  email: '2132049351@qq.com',
}
