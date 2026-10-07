import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import DigChain from '@/components/DigChain'
import { getAllDigSlugs, getDigData, getDigSessions } from '@/lib/digs'
import { markdownToHtml, estimateReadingTime } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

interface PageProps {
  params: { session: string; slug: string }
}

// build 时逐会话逐主题生成静态路径：丢新会话目录即出现新路由
export async function generateStaticParams() {
  return getAllDigSlugs().map((item) => ({
    session: item.params.session,
    slug: item.params.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dig = getDigData(params.session, params.slug)

  if (!dig) {
    return { title: '深挖主题未找到' }
  }

  return {
    title: `${dig.title} - ${siteConfig.title}`,
    description: dig.description,
  }
}

export default async function DigPage({ params }: PageProps) {
  const dig = getDigData(params.session, params.slug)

  if (!dig) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-zhserif text-ink-dark mb-4">深挖主题未找到</h1>
          <p className="text-ink/60 mb-6">这个主题不存在或已被删除。</p>
          <Link href="/digs" className="btn-classic">
            返回深挖列表
          </Link>
        </div>
      </Layout>
    )
  }

  // 逐问渲染：问题走原话预排版（客户端组件里直接输出文本），
  // 回答走文章同款 Markdown 管线（GFM 表格 + 代码高亮 + 锚点）
  const steps = await Promise.all(
    dig.steps.map(async (s) => ({
      index: s.index,
      round: s.round,
      kind: s.kind,
      question: s.question,
      answerHtml: await markdownToHtml(s.answer),
    }))
  )

  const fullText = dig.steps.map((s) => `${s.question}\n${s.answer}`).join('\n')
  const readingTime = estimateReadingTime(fullText)
  const roundSpan =
    dig.rounds.length > 1 ? `跨 ${dig.rounds.length} 轮` : dig.rounds.length === 1 ? '单轮' : ''

  // 上一主题 / 下一主题（仅限本会话内）
  const session = getDigSessions().find((s) => s.slug === dig.sessionSlug)
  const siblings = session?.digs ?? []
  const pos = siblings.findIndex((d) => d.slug === dig.slug)
  const prev = pos > 0 ? siblings[pos - 1] : null
  const next = pos >= 0 && pos < siblings.length - 1 ? siblings[pos + 1] : null

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Link
          href="/digs"
          className="inline-flex items-center text-sm text-ink/50 hover:text-ink-dark transition-colors mb-8"
        >
          ← 返回深挖列表
        </Link>

        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-zhserif text-ink-dark mb-4 leading-snug">
            {dig.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
            {/* 会话名：本主题所属的深挖会话 */}
            <span className="px-2 py-0.5 bg-bamboo/15 text-bamboo-dark rounded-sm text-xs">
              {dig.sessionTitle}
            </span>
            {dig.date && <time dateTime={dig.date}>{formatDate(dig.date)}</time>}
            <span className="text-ink/40">
              {dig.steps.length} 问
              {roundSpan && ` · ${roundSpan}`}
            </span>
            <span className="text-ink/40">约 {readingTime}阅读</span>
          </div>

          {dig.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dig.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-mist/50 text-ink/60 rounded-sm text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {dig.description && (
            <p className="mt-6 text-sm text-ink/60 leading-relaxed">{dig.description}</p>
          )}

          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </header>

        <DigChain steps={steps} />

        <div className="divider mt-16">
          <span className="divider-text">◆</span>
        </div>

        {/* 上一主题 / 下一主题（本会话内） */}
        <nav className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          {prev ? (
            <Link
              href={`/digs/${dig.sessionSlug}/${prev.slug}`}
              className="text-sm text-ink/60 hover:text-ink-dark transition-colors"
            >
              ← 上一主题 · {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/digs/${dig.sessionSlug}/${next.slug}`}
              className="text-sm text-ink/60 hover:text-ink-dark transition-colors sm:text-right"
            >
              下一主题 · {next.title} →
            </Link>
          )}
        </nav>
      </div>
    </Layout>
  )
}
