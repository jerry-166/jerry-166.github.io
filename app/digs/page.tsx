import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { getDigSessions, formatDigDate } from '@/lib/digs'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `深挖 - ${siteConfig.title}`,
  description: `深挖会话目录：一场会话一条主线，点进会话看主题追问链与原始轮次`,
}

// 深挖目录页：只列会话卡片，点击进入 /digs/[session] 单会话页
// build 时扫描 content/digs/ 的会话目录，新丢入的会话自动多一张卡片
export default function DigsPage() {
  const sessions = getDigSessions().map((session) => ({
    slug: session.slug,
    title: session.title,
    date: session.date,
    description: session.description,
    tags: session.tags,
    topicCount: session.digs.length,
    stepCount: session.digs.reduce((sum, d) => sum + d.steps.length, 0),
  }))
  const totalSteps = sessions.reduce((sum, s) => sum + s.stepCount, 0)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark mb-2">深挖</h1>
          <p className="text-sm text-ink/60">
            一次会话追到底 · {sessions.length} 场 · {totalSteps} 问 —— 问题常显，回答折叠，先自测再对照
          </p>

          <div className="divider mt-6">
            <span className="divider-text">✦</span>
          </div>
        </header>

        {sessions.length > 0 ? (
          <div className="space-y-6">
            {sessions.map((s) => (
              <Link key={s.slug} href={`/digs/${s.slug}`} className="card-classic group block">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-zhserif text-ink-dark group-hover:text-bamboo-dark transition-colors">
                    {s.title}
                  </h2>
                  {s.date && (
                    <span className="text-xs text-ink/40 shrink-0">{formatDigDate(s.date)}</span>
                  )}
                </div>

                <div className="mt-1 text-xs text-ink/40">
                  {s.topicCount} 主题 · {s.stepCount} 问
                </div>

                {s.description && (
                  <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-2">
                    {s.description}
                  </p>
                )}

                {s.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-mist/50 text-ink/60 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-xs text-ink/40 group-hover:text-bamboo-dark transition-colors">
                  进入会话 →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">暂无深挖会话，挖一场加一场。</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
