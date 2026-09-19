'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { examTopicOrder } from '@/lib/config'

// 与 lib/exams.ts 的 ExamQuestion / ExamMeta 对应（客户端只用到这几个字段）
interface ExamQuestion {
  title: string
  topic: string
  type?: string
  anchor?: string
}

interface Exam {
  slug: string
  company: string
  date: string
  title: string
  description?: string
  topics: string[]
  questions: ExamQuestion[]
}

type ViewMode = 'company' | 'topic'

// 日期格式化：2026-08-30 -> 2026年8月30日
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 考点排序权重：四大件与已知扩展按 examTopicOrder 配置顺序在前，
// 新考点（不在配置里）自动排到最后，按题数、名称排序——零改码引入新考点
function topicRank(topic: string) {
  const i = examTopicOrder.indexOf(topic)
  return i === -1 ? examTopicOrder.length : i
}

// 公司视图的卡片：整场笔试为粒度
function ExamCard({ exam, onSelectTopic }: { exam: Exam; onSelectTopic: (topic: string) => void }) {
  return (
    <article className="card-classic group">
      <Link href={`/exams/${exam.slug}`} className="block">
        <h2 className="text-lg md:text-xl font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors mb-2">
          {exam.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <time className="text-xs text-ink/50 tracking-wide-custom">{formatDate(exam.date)}</time>
          {exam.questions.length > 0 && (
            <span className="text-xs text-ink/40">{exam.questions.length} 题</span>
          )}
        </div>
        {exam.description && (
          <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-2">{exam.description}</p>
        )}
      </Link>
      {/* 考点标签：点击跳到考点视图并锁定该考点 */}
      {exam.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {exam.topics.map((topic) => (
            <button
              key={topic}
              onClick={(e) => {
                e.preventDefault()
                onSelectTopic(topic)
              }}
              className="text-xs px-2 py-1 bg-mist/50 text-ink/60 rounded-sm hover:bg-bamboo/15 hover:text-bamboo-dark transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function ExamListClient({ exams }: { exams: Exam[] }) {
  // 详情页考点标签通过 /exams?topic=xxx 直达考点视图。
  // 用 useSearchParams（而非页面 props 读 searchParams）是为了让页面保持静态导出
  const searchParams = useSearchParams()
  const urlTopic = searchParams.get('topic')
  // 只认可实际存在的考点，拼错的 topic 参数当作没有
  const initialTopic =
    urlTopic && exams.some((exam) => exam.topics.includes(urlTopic)) ? urlTopic : undefined

  // 视图模式：company = 按公司（整场粒度），topic = 按考点（题目粒度）
  const [view, setView] = useState<ViewMode>(initialTopic ? 'topic' : 'company')
  const [searchQuery, setSearchQuery] = useState('')
  // 锁定单个考点：从卡片标签或详情页深链进入考点视图时生效
  const [pinnedTopic, setPinnedTopic] = useState<string | null>(initialTopic ?? null)

  // 搜索过滤：公司名 / 标题 / 简介 / 考点 / 每道题的题目标题
  const filteredExams = useMemo(() => {
    if (!searchQuery) return exams
    const q = searchQuery.toLowerCase()
    return exams.filter(
      (exam) =>
        exam.company.toLowerCase().includes(q) ||
        exam.title.toLowerCase().includes(q) ||
        exam.description?.toLowerCase().includes(q) ||
        exam.topics.some((t) => t.toLowerCase().includes(q)) ||
        exam.questions.some((ques) => ques.title.toLowerCase().includes(q))
    )
  }, [exams, searchQuery])

  // 公司分组：{ 公司 -> 该公司的所有场次（日期倒序） }
  const companyGroups = useMemo(() => {
    const map = new Map<string, Exam[]>()
    for (const exam of filteredExams) {
      if (!map.has(exam.company)) map.set(exam.company, [])
      map.get(exam.company)!.push(exam)
    }
    return Array.from(map.entries()).map(([company, list]) => ({ company, exams: list }))
  }, [filteredExams])

  // 考点分组：题目为粒度。每道题按自己的 topic 归入对应分组，
  // 同一考点下汇聚不同公司、不同场次的所有相关题目。
  // 没写 questions 索引的旧文件退化为整场一条，保证不丢内容。
  const topicGroups = useMemo(() => {
    const map = new Map<string, { q: ExamQuestion; exam: Exam }[]>()
    for (const exam of filteredExams) {
      const entries: ExamQuestion[] =
        exam.questions.length > 0
          ? exam.questions
          : exam.topics.map((t) => ({ title: exam.title, topic: t }))
      for (const q of entries) {
        if (pinnedTopic && q.topic !== pinnedTopic) continue
        if (!map.has(q.topic)) map.set(q.topic, [])
        map.get(q.topic)!.push({ q, exam })
      }
    }
    return Array.from(map.entries())
      .map(([topic, questions]) => ({ topic, questions }))
      .sort((a, b) => {
        // 已知考点按体系顺序（四大件在前），未知考点排最后；
        // 同级再按题数降序、名称排序
        const ra = topicRank(a.topic)
        const rb = topicRank(b.topic)
        if (ra !== rb) return ra - rb
        if (b.questions.length !== a.questions.length)
          return b.questions.length - a.questions.length
        return a.topic.localeCompare(b.topic, 'zh')
      })
  }, [filteredExams, pinnedTopic])

  // 点击卡片考点标签：切到考点视图并锁定该考点
  const selectTopic = (topic: string) => {
    setView('topic')
    setPinnedTopic(topic)
  }

  // ESC 清空筛选
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('')
        setPinnedTopic(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const totalTopics = useMemo(() => new Set(exams.flatMap((exam) => exam.topics)).size, [exams])
  const hasFilters = searchQuery || pinnedTopic

  const tabClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-sm transition-all duration-200 ${
      active
        ? 'bg-ink/10 text-ink-dark font-medium'
        : 'bg-mist/30 text-ink/50 hover:text-ink/70'
    }`

  return (
    <div>
      {/* 搜索 + 视图切换：同一份题目索引数据，两种切分 */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索公司、考点、题目..."
            className="w-full pl-10 pr-4 py-2.5 bg-rice border border-mist/60 rounded-sm text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-bamboo/50 focus:ring-1 focus:ring-bamboo/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 视图切换 tab：公司 = 整场粒度，考点 = 题目粒度 */}
          <button
            onClick={() => {
              setView('company')
              setPinnedTopic(null)
            }}
            className={tabClass(view === 'company')}
          >
            按公司 · {companyGroups.length}
          </button>
          <button onClick={() => setView('topic')} className={tabClass(view === 'topic')}>
            按考点 · {totalTopics}
          </button>

          {/* 考点视图锁定单个考点时显示解除按钮 */}
          {view === 'topic' && pinnedTopic && (
            <button
              onClick={() => setPinnedTopic(null)}
              className="ml-1 text-xs px-3 py-1.5 rounded-sm bg-bamboo/15 text-bamboo-dark font-medium"
            >
              {pinnedTopic} ✕
            </button>
          )}
        </div>
      </div>

      {/* 筛选状态提示 */}
      {hasFilters && (
        <div className="mb-4 text-xs text-ink/40">
          找到 {filteredExams.length} 场笔试
          <button
            onClick={() => {
              setSearchQuery('')
              setPinnedTopic(null)
            }}
            className="ml-3 text-bamboo-dark hover:text-bamboo transition-colors"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 公司视图：整场笔试为粒度，看完整笔试内容 */}
      {view === 'company' ? (
        companyGroups.length > 0 ? (
          <div className="space-y-10">
            {companyGroups.map(({ company, exams: list }) => (
              <section key={company}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-lg font-zhserif text-ink-dark">{company}</h2>
                  <span className="text-xs text-ink/40">{list.length} 场</span>
                </div>
                <div className="space-y-6">
                  {list.map((exam) => (
                    <ExamCard key={exam.slug} exam={exam} onSelectTopic={selectTopic} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">没有找到匹配的笔试</p>
          </div>
        )
      ) : (
        /* 考点视图：题目为粒度，同一考点汇聚各公司各场次的题 */
        topicGroups.length > 0 ? (
          <div className="space-y-6">
            {topicGroups.map(({ topic, questions }) => (
              <section key={topic} className="card-classic">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-zhserif text-ink-dark">{topic}</h2>
                  <span className="text-xs text-ink/40 shrink-0">
                    {questions.length} 题 · {new Set(questions.map((x) => x.exam.company)).size} 家公司
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-mist/40">
                  {questions.map(({ q, exam }) => (
                    <li
                      key={`${exam.slug}-${q.title}`}
                      className="py-3 flex items-baseline justify-between gap-4"
                    >
                      {/* 锚点直达：anchor 在数据层与 rehype-slug 同源生成，点击直接跳到该题小节 */}
                      <Link
                        href={`/exams/${exam.slug}${q.anchor ? `#${q.anchor}` : ''}`}
                        title={`${exam.company} · ${formatDate(exam.date)}`}
                        className="text-sm text-ink-dark hover:text-bamboo-dark transition-colors leading-relaxed"
                      >
                        {q.title}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        {q.type && (
                          <span className="text-xs px-1.5 py-0.5 bg-mist/50 text-ink/50 rounded-sm">
                            {q.type}
                          </span>
                        )}
                        <span className="text-xs text-ink/40">{exam.company}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">没有找到匹配的题目</p>
          </div>
        )
      )}
    </div>
  )
}
