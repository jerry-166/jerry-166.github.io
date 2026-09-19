import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'

// ============================================================
// 笔试复盘数据层（v2：题目级考点索引）
//
// 增量更新零改码：新的一场笔试只需往 content/exams/ 丢一个
// 带 frontmatter 的 .md 文件（_ 开头的模板等辅助文件不收录）。
//
// frontmatter 约定（唯一需要遵守的格式）：
// ---
// company: 用友集团          # 公司名（按公司分类的依据）
// date: 2026-08-30          # 笔试日期
// title: 用友集团笔试复盘     # 页面标题（可省略，默认「{company}笔试复盘」）
// description: 一句话简介     # 可选，显示在列表卡片
// questions:                 # 题目索引：每道题一条，考点区分到题（按考点分类的依据）
//   - title: 第 8 题：Linux 权限 754
//     topic: 操作系统         # 考点：四大件 + 扩展（见 lib/config.ts 的 examTopicOrder）
//     type: 客观题            # 可选：客观题 / 编程题 / AI Coding / 深挖
//     section: 判定总览       # 可选：跳转目标标题；缺省用 title 本身
// ---
// topics 不再手写：由 questions 里每题 topic 的并集自动推导；
// 没写 questions 的文件退回 frontmatter 的 topics 字段（整场粒度）。
// ============================================================

const examsDirectory = path.join(process.cwd(), 'content/exams')

export interface ExamQuestion {
  title: string
  topic: string
  type?: string
  // 正文对应标题的锚点（与详情页 rehype-slug 生成的 id 完全一致），
  // 考点视图靠它从题目直达详情页的具体小节；未命中标题时为 undefined
  anchor?: string
}

export interface ExamMeta {
  slug: string
  company: string
  date: string
  title: string
  description?: string
  topics: string[]
  questions: ExamQuestion[]
}

// 扫描 content/exams/ 下的 .md；_ 开头的是模板等辅助文件，不收录为笔试
function listExamFiles(): string[] {
  if (!fs.existsSync(examsDirectory)) {
    return []
  }
  return fs
    .readdirSync(examsDirectory)
    .filter((fileName) => fileName.endsWith('.md') && !fileName.startsWith('_'))
}

// 从 Markdown 正文提取全部标题并生成锚点 id。
// 关键：用 github-slugger、按文档顺序逐个 slug，与详情页渲染管线中
// rehype-slug 的算法完全同源同序（包括重名标题的 -1/-2 去重后缀），
// 这样 questions 里的 title/section 命中标题时拿到的锚点才真正可跳转。
function buildHeadingAnchors(content: string): Map<string, string> {
  const slugger = new GithubSlugger()
  const anchors = new Map<string, string>()
  const headingRegex = /^#{1,6}\s+(.+)$/gm
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].trim()
    anchors.set(text, slugger.slug(text))
  }
  return anchors
}

// 解析题目索引：frontmatter 的 questions 数组 -> ExamQuestion[]
// 每题必须有 title 和 topic（缺失的题默认归入「其他」，保证每道题都有考点）
function parseQuestions(raw: unknown, anchors: Map<string, string>): ExamQuestion[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const questions: ExamQuestion[] = []
  for (const item of raw) {
    const q = item as Record<string, unknown>
    const title = String(q.title ?? '').trim()
    if (!title) {
      continue
    }
    // section 指定跳转目标标题（如只在判定总览表中的小题填「判定总览」）；
    // 有独立小节的题不写 section，直接用 title 与正文标题匹配
    const target = q.section ? String(q.section) : title
    questions.push({
      title,
      topic: String(q.topic ?? '').trim() || '其他',
      type: q.type ? String(q.type) : undefined,
      anchor: anchors.get(target),
    })
  }
  return questions
}

// 解析单个笔试文件：frontmatter 元数据 + 题目索引 + 锚点解析
function parseExamFile(slug: string): ExamMeta | null
function parseExamFile(slug: string, includeContent: true): (ExamMeta & { content: string }) | null
function parseExamFile(slug: string, includeContent = false): ExamMeta | (ExamMeta & { content: string }) | null {
  // dev 模式下中文/特殊字符 slug 可能以 URL 编码形式传入，需先解码
  const decodedSlug = decodeURIComponent(slug)
  const fullPath = path.join(examsDirectory, `${decodedSlug}.md`)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  // date 强制转字符串：纯日期 frontmatter 会被 gray-matter 解析为 Date 对象，
  // 传入 Server Component 时无法序列化，会直接运行时报错（与 posts.ts 同一坑）
  const dateStr =
    data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date ?? '')

  const questions = parseQuestions(data.questions, buildHeadingAnchors(content))

  // 考点 = 每题 topic 的并集（自动推导）；没有 questions 的旧文件退回 frontmatter topics
  const topics =
    questions.length > 0
      ? Array.from(new Set(questions.map((q) => q.topic)))
      : Array.isArray(data.topics)
        ? data.topics.map(String)
        : []

  const meta: ExamMeta = {
    slug: decodedSlug,
    company: String(data.company ?? '未知公司'),
    date: dateStr,
    title: String(data.title ?? `${data.company ?? ''}笔试复盘`),
    description: data.description ? String(data.description) : undefined,
    topics,
    questions,
  }

  return includeContent ? { ...meta, content } : meta
}

// 获取所有笔试列表（按日期倒序，最新在前）
export function getSortedExamsData(): ExamMeta[] {
  return listExamFiles()
    .map((fileName) => parseExamFile(fileName.replace(/\.md$/, '')))
    .filter((exam): exam is ExamMeta => exam !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

// 获取单场笔试的完整数据（元数据 + 题目索引 + Markdown 正文）
export function getExamData(slug: string): (ExamMeta & { content: string }) | null {
  return parseExamFile(slug, true)
}

// 生成静态路径（build 时逐文件扫描，新文件自动出现新路由）
export function getAllExamSlugs() {
  return listExamFiles().map((fileName) => ({
    params: {
      slug: fileName.replace(/\.md$/, ''),
    },
  }))
}
