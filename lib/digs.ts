import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ============================================================
// 深挖数据层（会话 → 主题 → 追问链，三级结构）
//
// 一场 AI 深挖会话独立一个目录，互不混淆：
//
//   content/digs/
//     {session-slug}/               ← 一场会话（如 2026-09-30-rerank-oversubscription）
//       _meta.md                    ← 会话元数据（title/date/order/description/tags）
//       01-xxx.md                   ← 该会话拆出的主题（追问链文件）
//       02-xxx.md
//
// 主题文件正文为交替出现的「问/答」步骤（原文搬运，不改写）：
//
//   ## Q1 · 第1轮 · 初始
//   （用户当时的原话）
//   ## A1 · 第1轮
//   （回答原文的对应小节）
//
// 增量更新零改码：丢一个新会话目录（含 _meta.md + 主题文件）
// 即可；_ 开头文件不收录为主题。路由 /digs/{session}/{topic}。
// ============================================================

const digsDirectory = path.join(process.cwd(), 'content/digs')

export interface DigStep {
  index: number // 主题内第几问（1 起）
  round: number // 来自会话第几轮（1 起）
  kind: 'initial' | 'followup'
  question: string
  answer: string
}

export interface DigMeta {
  slug: string
  sessionSlug: string
  sessionTitle: string
  title: string
  date: string
  order: number
  description?: string
  tags: string[]
  steps: DigStep[]
  rounds: number[] // 该主题横跨的会话轮次（升序去重）
}

export interface DigSession {
  slug: string
  title: string
  date: string
  order: number
  description?: string
  tags: string[]
  digs: DigMeta[]
}

// 轮次视图的单条：指向某主题详情页的具体一问
export interface ChronicleStep {
  slug: string // 主题 slug
  sessionSlug: string
  topicTitle: string
  stepIndex: number
  kind: 'initial' | 'followup'
  excerpt: string
}

// ---- 会话目录扫描 ----

// digs/ 下的子目录各为一场会话；_ 开头（如 _template/）不收录
function listSessionDirs(): string[] {
  if (!fs.existsSync(digsDirectory)) {
    return []
  }
  return fs
    .readdirSync(digsDirectory, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
}

function listTopicFiles(sessionDir: string): string[] {
  return fs
    .readdirSync(sessionDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
}

// ---- 主题追问链解析 ----

// 按 “## Qn · 第N轮 · 初始|追问 / ## An · 第N轮” 交替切分
function parseSteps(content: string): DigStep[] {
  const markerRe = /^## (Q|A)(\d+) · 第(\d+)轮(?: · (初始|追问))?\s*$/
  const chunks: { kind: 'Q' | 'A'; idx: number; round: number; label?: string; text: string }[] = []
  let buf: string[] = []
  let cur: { kind: 'Q' | 'A'; idx: number; round: number; label?: string } | null = null
  const flush = () => {
    if (cur) chunks.push({ ...cur, text: buf.join('\n').trim() })
    buf = []
  }
  for (const ln of content.split('\n')) {
    const m = ln.match(markerRe)
    if (m) {
      flush()
      cur = {
        kind: m[1] as 'Q' | 'A',
        idx: parseInt(m[2], 10),
        round: parseInt(m[3], 10),
        label: m[4],
      }
    } else {
      buf.push(ln)
    }
  }
  flush()

  const questions = new Map(chunks.filter((c) => c.kind === 'Q').map((c) => [c.idx, c]))
  return chunks
    .filter((c) => c.kind === 'A')
    .map((a) => {
      const q = questions.get(a.idx)
      const kind: 'initial' | 'followup' =
        q?.label === '初始'
          ? 'initial'
          : q?.label === '追问'
            ? 'followup'
            : a.idx === 1
              ? 'initial'
              : 'followup'
      return {
        index: a.idx,
        round: q?.round ?? a.round,
        kind,
        question: q?.text ?? '',
        answer: a.text,
      }
    })
    .filter((s) => s.question && s.answer)
}

function toDateString(raw: unknown): string {
  return raw instanceof Date ? raw.toISOString().split('T')[0] : String(raw ?? '')
}

// ---- 解析一场会话：_meta.md 元数据 + 其下全部主题 ----

function parseSession(sessionSlug: string): DigSession | null {
  const sessionDir = path.join(digsDirectory, sessionSlug)
  const topicFiles = listTopicFiles(sessionDir)
  if (topicFiles.length === 0) {
    return null
  }

  // 会话元数据：_meta.md；缺失时用目录名兜底（日期取目录前缀）
  let title = sessionSlug
  let date = ''
  let order = 999
  let description: string | undefined
  let tags: string[] = []
  const metaPath = path.join(sessionDir, '_meta.md')
  if (fs.existsSync(metaPath)) {
    const { data } = matter(fs.readFileSync(metaPath, 'utf8'))
    title = String(data.title ?? title)
    date = toDateString(data.date)
    order = Number(data.order ?? 999)
    description = data.description ? String(data.description) : undefined
    tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  }
  const m = sessionSlug.match(/^(\d{4}-\d{2}-\d{2})/)
  if (!date && m) {
    date = m[1]
  }

  const digs: DigMeta[] = topicFiles
    .map((fileName) => {
      const topicSlug = fileName.replace(/\.md$/, '')
      const { data, content } = matter(fs.readFileSync(path.join(sessionDir, fileName), 'utf8'))
      const steps = parseSteps(content)
      if (steps.length === 0) {
        return null
      }
      const rounds = Array.from(new Set(steps.map((s) => s.round))).sort((a, b) => a - b)
      return {
        slug: topicSlug,
        sessionSlug,
        sessionTitle: title,
        title: String(data.title ?? topicSlug),
        date: toDateString(data.date) || date,
        order: Number(data.order ?? 999),
        description: data.description ? String(data.description) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        steps,
        rounds,
      } as DigMeta
    })
    .filter((d): d is DigMeta => d !== null)
    .sort((a, b) => (a.order === b.order ? a.title.localeCompare(b.title, 'zh') : a.order - b.order))

  if (digs.length === 0) {
    return null
  }

  return { slug: sessionSlug, title, date, order, description, tags, digs }
}

function parseAllSessions(): DigSession[] {
  return listSessionDirs()
    .map(parseSession)
    .filter((s): s is DigSession => s !== null)
    .sort((a, b) => {
      // 会话间：日期倒序（新会话在前），无日期按 order
      if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1
      if (a.order !== b.order) return a.order - b.order
      return a.title.localeCompare(b.title, 'zh')
    })
}

// 全部会话（含各自主题），每场会话独立成组
export function getDigSessions(): DigSession[] {
  return parseAllSessions()
}

// 单个主题（session + topic 两级定位）
export function getDigData(sessionSlug: string, topicSlug: string): DigMeta | null {
  const session = parseSession(decodeURIComponent(sessionSlug))
  return session?.digs.find((d) => d.slug === decodeURIComponent(topicSlug)) ?? null
}

export function getAllDigSlugs() {
  return parseAllSessions().flatMap((session) =>
    session.digs.map((dig) => ({
      params: {
        session: session.slug,
        slug: dig.slug,
      },
    }))
  )
}

// 问题摘要：去掉代码块/标题标记，压成一行
function excerptOf(md: string, max = 80): string {
  const t = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

// 轮次视图：每场会话内部按「原始轮次」归位，还原当年一问一问挖下来的顺序
export interface SessionChronicle {
  sessionSlug: string
  sessionTitle: string
  sessionDate: string
  rounds: { round: number; steps: ChronicleStep[] }[]
}

export function getDigChronicle(): SessionChronicle[] {
  return parseAllSessions().map((session) => {
    const map = new Map<number, ChronicleStep[]>()
    for (const dig of session.digs) {
      for (const s of dig.steps) {
        if (!map.has(s.round)) map.set(s.round, [])
        map.get(s.round)!.push({
          slug: dig.slug,
          sessionSlug: session.slug,
          topicTitle: dig.title,
          stepIndex: s.index,
          kind: s.kind,
          excerpt: excerptOf(s.question),
        })
      }
    }
    return {
      sessionSlug: session.slug,
      sessionTitle: session.title,
      sessionDate: session.date,
      rounds: Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([round, steps]) => ({
          round,
          steps: steps.sort((a, b) => a.stepIndex - b.stepIndex),
        })),
    }
  })
}
