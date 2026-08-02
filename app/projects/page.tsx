import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { getUserRepos, getLanguageColor, GitHubRepo } from '@/lib/github'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `项目展示 - ${siteConfig.title}`,
  description: `${siteConfig.author} 的 GitHub 项目作品集`,
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const langColor = getLanguageColor(repo.language)

  return (
    <article className="card-classic group">
      <Link href={`/projects/${repo.name}`} className="block">
        {/* 顶部：仓库名 + 公开标识 */}
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg md:text-xl font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors">
            {repo.name}
          </h2>
          <span className="text-xs px-2 py-0.5 border border-mist text-ink/50 rounded-full shrink-0 ml-3">
            Public
          </span>
        </div>

        {/* 描述 */}
        <p className="text-sm text-ink/70 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {repo.description || '暂无描述'}
        </p>

        {/* 元信息 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink/60">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: langColor }}
              />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.089.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.089-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
            </svg>
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
            </svg>
            <span>{repo.forks_count}</span>
          </div>
          <span className="ml-auto">更新于 {formatDate(repo.pushed_at)}</span>
        </div>

        {/* 悬停提示 */}
        <div className="mt-4 text-sm text-bamboo opacity-0 group-hover:opacity-100 transition-opacity">
          查看 README →
        </div>
      </Link>
    </article>
  )
}

export default async function ProjectsPage() {
  let repos: GitHubRepo[] = []
  let error: string | null = null

  try {
    repos = await getUserRepos()
  } catch (e) {
    error = e instanceof Error ? e.message : '获取仓库失败'
  }

  return (
    <Layout>
      <div className="ink-wash absolute top-0 left-0 right-0 h-64 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* 页面标题 */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-zhserif text-ink-dark mb-4 tracking-wide">
            项目展示
          </h1>
          <p className="text-base text-ink/70 max-w-2xl mx-auto leading-relaxed">
            这里汇集了我在 GitHub 上的开源项目，点击查看 README 详情。
          </p>
          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </section>

        {/* GitHub 跳转 */}
        <div className="text-center mb-10">
          <a
            href="https://github.com/jerry-166"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-classic inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            访问 GitHub 主页
          </a>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-center py-8 text-ink/60 bg-rice-warm/50 rounded-lg border border-mist/50 mb-8">
            <p>无法加载仓库列表：{error}</p>
            <p className="text-sm mt-2">请稍后刷新，或检查 GitHub API 访问限制。</p>
          </div>
        )}

        {/* 项目网格 */}
        {repos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-16">
            <p className="text-ink/50">暂无项目数据</p>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
