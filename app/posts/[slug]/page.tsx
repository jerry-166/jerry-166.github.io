import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { getAllPostSlugs, getPostData, markdownToHtml, estimateReadingTime } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import TableOfContents from '@/components/TableOfContents'

interface PageProps {
  params: { slug: string }
}

// 生成静态路径
export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((item) => ({
    slug: item.params.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPostData(params.slug)
  
  if (!post) {
    return {
      title: '文章未找到',
    }
  }

  return {
    title: `${post.title} - ${siteConfig.title}`,
    description: post.description,
  }
}

export default async function PostPage({ params }: PageProps) {
  const post = getPostData(params.slug)

  if (!post) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-zhserif text-ink-dark mb-4">文章未找到</h1>
          <p className="text-ink/60 mb-6">抱歉，这篇文章不存在或已被删除。</p>
          <Link href="/posts" className="btn-classic">
            返回文章列表
          </Link>
        </div>
      </Layout>
    )
  }

  // 将 Markdown 转换为 HTML
  const contentHtml = await markdownToHtml(post.content || '')

  // 估算阅读时间
  const readingTime = estimateReadingTime(post.content || '')

  // 格式化日期
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
          {/* 主内容区 */}
          <article className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            {/* 返回链接 */}
            <Link 
              href="/posts" 
              className="inline-flex items-center text-sm text-ink/50 hover:text-ink-dark transition-colors mb-8"
            >
              ← 返回文章列表
            </Link>

            {/* 文章头部 */}
            <header className="mb-10">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-zhserif text-ink-dark mb-4 leading-snug">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
                <time dateTime={post.date}>
                  {formatDate(post.date)}
                </time>

                {/* 阅读时间 */}
                <span className="text-ink/40">
                  约 {readingTime}阅读
                </span>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-mist/50 text-ink/60 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 装饰线 */}
              <div className="divider mt-8">
                <span className="divider-text">✦</span>
              </div>
            </header>

            {/* 文章内容 */}
            <div 
              id="article-content"
              className="prose-classic"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* 底部装饰 */}
            <div className="divider mt-16">
              <span className="divider-text">◆</span>
            </div>

            {/* 返回文章列表 */}
            <div className="mt-8 text-center">
              <Link 
                href="/posts"
                className="btn-classic inline-block"
              >
                返回文章列表
              </Link>
            </div>
          </article>

          {/* 侧边目录 - 桌面端显示 */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
