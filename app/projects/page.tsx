import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { getUserRepos, getLanguageColor, GitHubRepo } from '@/lib/github'
import { siteConfig, tutorialBooks, TutorialBook } from '@/lib/config'

export const metadata: Metadata = {
  title: `项目展示 - ${siteConfig.title}`,
  description: `${siteConfig.author} 的自研教程手册与 GitHub 项目作品集`,
}

// ISR: 每 1 小时自动重新拉取 GitHub 仓库列表，新项目自动同步
export const revalidate = 3600

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 教程书卡片：书籍装帧风格，左侧色条呼应各册主题色
function BookCard({ book, index }: { book: TutorialBook; index: number }) {
  return (
    <article className="card-classic group relative overflow-hidden">
      {/* 左侧强调色条 - 书脊效果 */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: book.accent }}
        aria-hidden
      />

      <a href={book.href} target="_blank" rel="noopener noreferrer" className="block pl-3">
        {/* 顶部：卷号徽章 + 书籍图标 */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ borderColor: `${book.accent}55`, color: book.accent }}
          >
            {book.volume}
          </span>
          <svg
            className="w-5 h-5 text-ink/25 group-hover:text-bamboo transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.247m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.247"
            />
          </svg>
        </div>

        {/* 书名 */}
        <h3 className="text-base md:text-lg font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors leading-snug">
          {book.title}
        </h3>

        {/* 简介 */}
        <p className="mt-2 text-sm text-ink/70 leading-relaxed line-clamp-3 min-h-[3.75rem]">
          {book.description}
        </p>

        {/* 标签 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {book.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-mist/40 text-ink/60 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 阅读引导 */}
        <div className="mt-4 text-sm text-bamboo opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          在线阅读 →
        </div>
      </a>

      {/* 序号水印 */}
      <span className="absolute bottom-2 right-3 text-4xl font-zhserif text-ink/5 select-none pointer-events-none">
        {String(index + 1).padStart(2, '0')}
      </span>
    </article>
  )
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
            这里汇集了我编写的教程手册系列，以及 GitHub 上的开源项目。
          </p>
          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </section>

        {/* 教程系列专区：前端系列 + MySQL 后端手册，书籍配置见 lib/config.ts tutorialBooks */}
        <section id="books" className="mb-16 md:mb-20 scroll-mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark">
              教程手册
            </h2>
            <span className="text-xs text-ink/50">
              共 {tutorialBooks.length} 册 · 持续更新
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutorialBooks.map((book, index) => (
              <BookCard key={book.href} book={book} index={index} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-ink/40 leading-relaxed">
            所有教程均为自包含静态页面，手机/平板/电脑均可流畅阅读，支持直接交互演示。
          </p>
        </section>

        {/* 开源项目专区 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark">
              开源项目
            </h2>
          </div>

          {/* GitHub 跳转 */}
          <div className="mb-10">
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
        </section>
      </div>
    </Layout>
  )
}
