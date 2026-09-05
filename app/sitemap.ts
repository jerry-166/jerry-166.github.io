import type { MetadataRoute } from 'next'
import { siteConfig, tutorialBooks } from '@/lib/config'
import { getSortedPostsData } from '@/lib/posts'

// 站点地图：首页 / 文章列表 / 各文章 / 项目页 / 关于页 + 教程书
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const posts = getSortedPostsData()

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/posts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${base}/posts/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    {
      url: `${base}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...tutorialBooks.map((book) => ({
      url: `${base}${book.href}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
