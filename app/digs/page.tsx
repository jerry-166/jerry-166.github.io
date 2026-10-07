import type { Metadata } from 'next'
import { Suspense } from 'react'
import Layout from '@/components/Layout'
import DigListClient from '@/components/DigListClient'
import { getDigSessions, getDigChronicle } from '@/lib/digs'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `深挖 - ${siteConfig.title}`,
  description: `把 AI 深挖会话按主题拆成追问链：问题常显、回答折叠，先自测再对照`,
}

export default function DigsPage() {
  // build 时扫描 content/digs/ 的会话目录，新丢入的会话自动出现
  const sessions = getDigSessions().map((session) => ({
    slug: session.slug,
    title: session.title,
    date: session.date,
    description: session.description,
    tags: session.tags,
    digs: session.digs.map((dig) => ({
      slug: dig.slug,
      title: dig.title,
      description: dig.description,
      tags: dig.tags,
      stepCount: dig.steps.length,
      rounds: dig.rounds,
    })),
  }))
  const chronicle = getDigChronicle()
  const totalSteps = sessions.reduce(
    (sum, s) => sum + s.digs.reduce((x, d) => x + d.stepCount, 0),
    0
  )

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
          /* Suspense：DigListClient 用 useSearchParams 读 ?view= 深链轮次视图，
             静态导出下必须包一层 Suspense 边界 */
          <Suspense fallback={null}>
            <DigListClient sessions={sessions} chronicle={chronicle} />
          </Suspense>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">暂无深挖会话，挖一场加一场。</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
