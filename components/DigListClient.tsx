'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// 单场会话视图（/digs/[session]），两种切法——
// 按主题（主题卡片，进详情页自测）/ 按轮次（还原当年一问一问挖下来的顺序）
// 目录页 /digs 只列会话卡片；新增会话目录丢进 content/digs/ 即自动出现新路由

interface DigCard {
  slug: string
  title: string
  description?: string
  tags: string[]
  stepCount: number
  rounds: number[]
}

interface SessionCard {
  slug: string
  title: string
  date: string
  description?: string
  tags: string[]
  digs: DigCard[]
}

interface ChronicleStep {
  slug: string
  sessionSlug: string
  topicTitle: string
  stepIndex: number
  kind: 'initial' | 'followup'
  excerpt: string
}

interface SessionChronicle {
  sessionSlug: string
  sessionTitle: string
  sessionDate: string
  rounds: { round: number; steps: ChronicleStep[] }[]
}

type ViewMode = 'topics' | 'round'

// 追问链缩略图：●—○—○—○，实心 = 初始一问，空心 = 追问
function MiniChain({ count }: { count: number }) {
  return (
    <div className="flex items-center" aria-label={`${count} 问`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="w-3 h-px bg-mist" aria-hidden />}
          <span
            className={`w-[9px] h-[9px] rounded-full shrink-0 ${
              i === 0 ? 'bg-bamboo' : 'bg-rice border border-bamboo/50'
            }`}
            aria-hidden
          />
        </span>
      ))}
    </div>
  )
}

export default function DigListClient({
  session,
  chronicle,
}: {
  session: SessionCard
  chronicle: SessionChronicle
}) {
  // ?view=rounds 深链进轮次视图；默认按主题
  const searchParams = useSearchParams()
  const [view, setView] = useState<ViewMode>(
    searchParams.get('view') === 'rounds' ? 'round' : 'topics'
  )

  const totalSteps = session.digs.reduce((sum, d) => sum + d.stepCount, 0)

  const tabClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-sm transition-all duration-200 ${
      active ? 'bg-ink/10 text-ink-dark font-medium' : 'bg-mist/30 text-ink/50 hover:text-ink/70'
    }`

  return (
    <div>
      {/* 视图切换 */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button onClick={() => setView('topics')} className={tabClass(view === 'topics')}>
          按主题 · {session.digs.length}
        </button>
        <button onClick={() => setView('round')} className={tabClass(view === 'round')}>
          按轮次 · {totalSteps} 问
        </button>
      </div>

      {/* 主题视图：一场会话的主题卡片 */}
      {view === 'topics' ? (
        <div className="space-y-6">
          {session.digs.map((dig) => (
            <article key={`${session.slug}/${dig.slug}`} className="card-classic group">
              <Link href={`/digs/${session.slug}/${dig.slug}`} className="block">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base md:text-lg font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors">
                    {dig.title}
                  </h3>
                  <MiniChain count={dig.stepCount} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/40">
                  <span>{dig.stepCount} 问</span>
                  {dig.rounds.length > 1 && <span>跨 {dig.rounds.length} 轮追问</span>}
                </div>
                {dig.description && (
                  <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-2">
                    {dig.description}
                  </p>
                )}
              </Link>
              {dig.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {dig.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-mist/50 text-ink/60 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        /* 轮次视图：还原原始对话——第几轮问了什么，各自落进哪个主题 */
        <div className="space-y-6">
          {chronicle.rounds.map(({ round, steps }) => (
            <div key={round}>
              <div className="flex items-baseline gap-3 mb-2 pl-1">
                <span className="text-sm font-medium text-ink/70">第 {round} 轮</span>
                <span className="text-xs text-ink/40">{steps.length} 问</span>
              </div>
              <div className="card-classic">
                <ul className="divide-y divide-mist/40">
                  {steps.map((s) => (
                    <li key={`${s.sessionSlug}-${s.slug}-${s.stepIndex}`} className="py-3">
                      <Link
                        href={`/digs/${s.sessionSlug}/${s.slug}#step-${s.stepIndex}`}
                        className="group flex items-baseline justify-between gap-4"
                      >
                        <span className="text-sm text-ink-dark group-hover:text-bamboo-dark transition-colors leading-relaxed">
                          {s.excerpt}
                        </span>
                        <span className="shrink-0 text-xs text-ink/40 group-hover:text-bamboo-dark transition-colors">
                          {s.kind === 'initial' ? '初始' : '追问'} · {s.topicTitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
