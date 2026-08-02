// GitHub 数据获取工具

const GITHUB_USERNAME = 'jerry-166'

// 通用请求头，优先使用环境变量中的 GITHUB_TOKEN
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

// 安全 fetch 包装
async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers || {}) },
    next: { revalidate: 3600 }, // ISR: 每小时重新验证
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${text}`)
  }
  return res
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  fork: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
  topics: string[]
}

// 获取用户仓库列表（默认过滤 fork）
export async function getUserRepos(
  username: string = GITHUB_USERNAME,
  includeForks: boolean = false
): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`
  const res = await safeFetch(url)
  const repos: GitHubRepo[] = await res.json()
  return repos
    .filter((repo) => includeForks || !repo.fork)
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
}

// 获取单个仓库详情
export async function getRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const res = await safeFetch(`https://api.github.com/repos/${owner}/${repo}`)
    return await res.json()
  } catch {
    return null
  }
}

// 获取 README 原始 Markdown
export async function getRepoReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await safeFetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`
    )
    const data = await res.json()
    if (!data.content) return null
    const markdown = Buffer.from(data.content, 'base64').toString('utf-8')
    return resolveReadmeImages(markdown, owner, repo, data.url)
  } catch {
    return null
  }
}

// 将 README 中的相对图片/链接转换为 GitHub raw 链接
function resolveReadmeImages(
  markdown: string,
  owner: string,
  repo: string,
  readmeApiUrl: string
): string {
  // 从 readmeApiUrl 推断 README 所在目录
  // 例如 .../contents/README.md  -> 根目录
  // .../contents/docs/README.md -> docs/
  const match = readmeApiUrl.match(/repos\/[^/]+\/[^/]+\/contents\/(.*)/)
  const readmePath = match?.[1] || ''
  const dir = readmePath.split('/').slice(0, -1).join('/')
  const baseDir = dir ? `${dir}/` : ''
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/main/${baseDir}`
  const blobBase = `https://github.com/${owner}/${repo}/blob/main/${baseDir}`

  // 替换图片相对路径
  const imgReplaced = markdown.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//')) {
        return match
      }
      const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '')
      return `![${alt}](${rawBase}${cleanSrc})`
    }
  )

  // 替换相对链接（非图片）指向仓库文件
  const linkReplaced = imgReplaced.replace(
    /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, href) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('//')) {
        return match
      }
      const cleanHref = href.replace(/^\.\//, '').replace(/^\//, '')
      return `[${text}](${blobBase}${cleanHref})`
    }
  )

  return linkReplaced
}

// GitHub 语言颜色映射（Tailwind 风格）
const languageColors: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Java: '#B07219',
  Go: '#00ADD8',
  Rust: '#DEA584',
  C: '#555555',
  'C++': '#F34B7D',
  'C#': '#178600',
  Shell: '#89E051',
  Vue: '#41B883',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
}

export function getLanguageColor(language: string | null): string {
  return language ? languageColors[language] || '#8B8B8B' : '#8B8B8B'
}
