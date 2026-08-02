import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Layout from '@/components/Layout'
import { getRepo, getRepoReadme, getLanguageColor, getUserRepos } from '@/lib/github'
import { markdownToHtml } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

interface ProjectDetailPageProps {
  params: Promise<{ repo: string }>
}

// ISR: 每 1 小时自动重新拉取 README，仓库内容更新自动同步
export const revalidate = 3600

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function VisitRepoButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-classic inline-flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      访问仓库
    </a>
  )
}

export async function generateStaticParams() {
  try {
    const repos = await getUserRepos()
    return repos.map((repo) => ({ repo: repo.name }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { repo } = await params
  const repository = await getRepo('jerry-166', repo)
  const title = repository?.name || repo
  const description = repository?.description || `${repo} 项目详情`
  return {
    title: `${title} - 项目展示 - ${siteConfig.title}`,
    description,
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { repo } = await params

  const [repository, readmeMarkdown] = await Promise.all([
    getRepo('jerry-166', repo),
    getRepoReadme('jerry-166', repo),
  ])

  if (!repository) {
    notFound()
  }

  const readmeHtml = readmeMarkdown ? await markdownToHtml(readmeMarkdown) : null
  const langColor = getLanguageColor(repository.language)

  return (
    <Layout>
      <div className="ink-wash absolute top-0 left-0 right-0 h-64 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 返回 + 面包屑 */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="text-sm text-ink/60 hover:text-bamboo-dark transition-colors"
          >
            ← 返回项目列表
          </Link>
        </div>

        {/* 顶部仓库信息卡片 */}
        <section className="card-classic mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark">
                  {repository.name}
                </h1>
                <span className="text-xs px-2 py-0.5 border border-mist text-ink/50 rounded-full">
                  Public
                </span>
              </div>

              <p className="text-base text-ink/80 leading-relaxed mb-4">
                {repository.description || '暂无描述'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70">
                {repository.language && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: langColor }}
                    />
                    <span>{repository.language}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.089.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.089-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                  </svg>
                  <span>{repository.stargazers_count} Stars</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
                  </svg>
                  <span>{repository.forks_count} Forks</span>
                </div>
                <span>创建于 {formatDate(repository.created_at)}</span>
                <span>更新于 {formatDate(repository.pushed_at)}</span>
              </div>
            </div>

            <div className="shrink-0">
              <VisitRepoButton href={repository.html_url} />
            </div>
          </div>

          {/* 顶部访问仓库提示 */}
          <div className="mt-6 pt-5 border-t border-mist/50 flex items-center justify-between">
            <span className="text-sm text-ink/60">
              源码、 issues、PR 请在 GitHub 查看
            </span>
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-bamboo hover:text-bamboo-dark transition-colors"
            >
              {repository.full_name} →
            </a>
          </div>
        </section>

        {/* README 内容 */}
        <section className="card-classic">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-mist/50">
            <svg className="w-5 h-5 text-ink/60" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.159.81-.317a.75.75 0 0 1 .54 0l.81.317a.75.75 0 0 0 .54 0l2.818-.872a.75.75 0 0 1 .52.706v3.294a.75.75 0 0 1-.252.561l-2.91 2.559a.75.75 0 0 1-.994 0l-2.91-2.559a.75.75 0 0 1-.252-.561V11.85a.75.75 0 0 1 .52-.706l2.818.872a.75.75 0 0 0 .54 0Z" />
            </svg>
            <h2 className="text-lg font-medium text-ink-dark">README</h2>
          </div>

          {readmeHtml ? (
            <div
              className="prose-classic"
              dangerouslySetInnerHTML={{ __html: readmeHtml }}
            />
          ) : (
            <div className="text-center py-12 text-ink/50">
              <p>该仓库暂无 README</p>
            </div>
          )}
        </section>

        {/* 底部访问仓库链接 */}
        <section className="mt-10 text-center">
          <div className="divider mb-8">
            <span className="divider-text">◆</span>
          </div>
          <VisitRepoButton href={repository.html_url} />
          <p className="mt-3 text-sm text-ink/50">
            在 GitHub 上查看完整源码、提交历史与 Issue 讨论
          </p>
        </section>
      </div>
    </Layout>
  )
}
