import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import TableOfContents from '@/components/TableOfContents'
import { getAllExamSlugs, getExamData } from '@/lib/exams'
import { markdownToHtml, estimateReadingTime } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

interface PageProps {
  params: { slug: string }
}

// build 时逐文件生成静态路径：content/exams/ 丢新文件即出现新路由
export async function generateStaticParams() {
  return getAllExamSlugs().map((item) => ({
    slug: item.params.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const exam = getExamData(params.slug)

  if (!exam) {
    return { title: '笔试复盘未找到' }
  }

  return {
    title: `${exam.title} - ${siteConfig.title}`,
    description: exam.description,
  }
}

export default async function ExamPage({ params }: PageProps) {
  const exam = getExamData(params.slug)

  if (!exam) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-zhserif text-ink-dark mb-4">笔试复盘未找到</h1>
          <p className="text-ink/60 mb-6">这场笔试的复盘不存在或已被删除。</p>
          <Link href="/exams" className="btn-classic">
            返回笔试列表
          </Link>
        </div>
      </Layout>
    )
  }

  // 复用文章的 Markdown 渲染管线（GFM 表格 + 代码高亮 + 标题锚点）
  const contentHtml = await markdownToHtml(exam.content || '')
  const readingTime = estimateReadingTime(exam.content || '')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex gap-12">
          <article className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            <Link
              href="/exams"
              className="inline-flex items-center text-sm text-ink/50 hover:text-ink-dark transition-colors mb-8"
            >
              ← 返回笔试列表
            </Link>

            <header className="mb-10">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-zhserif text-ink-dark mb-4 leading-snug">
                {exam.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
                {/* 公司名：本场的所属公司 */}
                <span className="px-2 py-0.5 bg-bamboo/15 text-bamboo-dark rounded-sm text-xs">
                  {exam.company}
                </span>
                <time dateTime={exam.date}>{formatDate(exam.date)}</time>
                <span className="text-ink/40">约 {readingTime}阅读</span>

                {/* 考点标签：深链到列表页考点视图并锁定该考点（/exams?topic=xxx） */}
                {exam.topics.length > 0 && (
                  <div className="flex gap-2">
                    {exam.topics.map((topic) => (
                      <Link
                        key={topic}
                        href={`/exams?topic=${encodeURIComponent(topic)}`}
                        className="px-2 py-0.5 bg-mist/50 text-ink/60 rounded-sm hover:text-ink-dark transition-colors"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="divider mt-8">
                <span className="divider-text">✦</span>
              </div>
            </header>

            <div
              id="article-content"
              className="prose-classic"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            <div className="divider mt-16">
              <span className="divider-text">◆</span>
            </div>

            <div className="mt-8 text-center">
              <Link href="/exams" className="btn-classic inline-block">
                返回笔试列表
              </Link>
            </div>
          </article>

          {/* 侧边目录 - 桌面端显示 */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto toc-scroll pr-2">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
