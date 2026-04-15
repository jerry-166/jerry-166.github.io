import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

const postsDirectory = path.join(process.cwd(), 'content/posts')

// 获取所有文章
export function getSortedPostsData() {
  // 确保目录存在
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      return getPostData(slug)
    })
    .filter((post): post is any => post !== null) // 过滤掉 null 值

  // 按日期排序（新的在前）
  return posts.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

// 获取单篇文章
export function getPostData(slug: string) {
  // Next.js dev 模式下中文 slug 可能以 URL 编码形式传入，需要先解码
  const decodedSlug = decodeURIComponent(slug)
  const fullPath = path.join(postsDirectory, `${decodedSlug}.md`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  // 将 date 强制转为字符串，避免 gray-matter 把纯日期 frontmatter 解析为 Date 对象
  // 传入 Next.js Server Component 时，Date 对象无法序列化会导致运行时报错
  const dateStr = data.date instanceof Date 
    ? data.date.toISOString().split('T')[0]
    : String(data.date ?? '')

  return {
    slug: decodedSlug,
    content,
    ...(data as { 
      title: string
      date: string
      description?: string
      tags?: string[]
      author?: string
    }),
    date: dateStr,
  }
}

// 获取所有文章slug（用于静态路径）
export function getAllPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      return {
        params: {
          slug: fileName.replace(/\.md$/, ''),
        },
      }
    })
}

// 从 Markdown 中提取标题目录（用于 TOC 组件）
export function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: { id: string; text: string; level: number }[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].replace(/\*\*(.+?)\*\*/g, '$1').trim()
    // rehype-slug 生成 id 的规则：转小写 + 空格变短横线 + 去除特殊字符
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    headings.push({ id, text, level })
  }

  return headings
}

// 估算阅读时间（中文约 300 字/分钟）
export function estimateReadingTime(content: string): string {
  // 移除 frontmatter 和代码块
  const cleaned = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
  const textLength = cleaned.replace(/\s/g, '').length
  const minutes = Math.ceil(textLength / 300)
  return `${minutes} 分钟`
}

// 将 Markdown 转换为 HTML（带语法高亮和标题锚点）
export async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify)
    .process(markdown)
  return result.toString()
}
