import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import Layout from '@/components/Layout'
import DigListClient from '@/components/DigListClient'
import { getDigSession, getSessionChronicle, getAllDigSessionSlugs, formatDigDate } from '@/lib/digs'
import { siteConfig } from '@/lib/config'

interface PageProps {
  params: { session: string }
}

// build 时逐会话生成静态路径：丢新会话目录即出现新会话页
export async function generateStaticParams() {
  return getAllDigSessionSlugs().map((item) => ({
    session: item.params.session,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = getDigSession(params.session)

  if (!session) {
    return { title: '深挖会话未找到' }
  }

  return {
    title: `${session.title} - 深挖 - ${siteConfig.title}`,
    description: session.description,
  }
}

export default function DigSessionPage({ params }: PageProps) {
  const session = getDigSession(params.session)

  if (!session) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-zhserif text-ink-dark mb-4">深挖会话未找到</h1>
          <p className="text-ink/60 mb-6">这场会话不存在或已被删除。</p>
          <Link href="/digs" className="btn-classic">
            返回深挖目录
          </Link>
        </div>
      </Layout>
    )
  }

  const chronicle = getSessionChronicle(session)
  const totalSteps = session.digs.reduce((sum, d) => sum + d.steps.length, 0)

  // 传给客户端组件的数据（只含展示所需字段，steps 全文留在服务端）
  const data = {
    slug: session.slug,
    title: session.title,
    date: session.date,
    description: session.description,
    tags: session.tags,
    digs: session.digs.map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      tags: d.tags,
      stepCount: d.steps.length,
      rounds: d.rounds,
    })),
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 返回目录 */}
        <Link
          href="/digs"
          className="inline-flex items-center text-sm text-ink/50 hover:text-ink-dark transition-colors mb-8"
        >
          ← 深挖目录
        </Link>

        {/* 会话头 */}
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark mb-3 leading-snug">
            {session.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
            {session.date && <time dateTime={session.date}>{formatDigDate(session.date)}</time>}
            <span className="text-ink/40">
              {session.digs.length} 主题 · {totalSteps} 问 · {chronicle.rounds.length} 轮
            </span>
          </div>

          {session.description && (
            <p className="mt-4 text-sm text-ink/60 leading-relaxed">{session.description}</p>
          )}

          {session.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {session.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-mist/50 text-ink/60 rounded-sm text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </header>

        {/* Suspense：DigListClient 用 useSearchParams 读 ?view=rounds 深链轮次视图，
            静态导出下必须包一层 Suspense 边界 */}
        <Suspense fallback={null}>
          <DigListClient session={data} chronicle={chronicle} />
        </Suspense>
      </div>
    </Layout>
  )
}
