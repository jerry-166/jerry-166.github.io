import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import PostListClient from '@/components/PostListClient'
import { getSortedPostsData } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `文章列表 - ${siteConfig.title}`,
  description: `浏览 ${siteConfig.author} 的所有文章`,
}

export default function PostsPage() {
  const allPosts = getSortedPostsData()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 页面标题 */}
        <header className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark mb-2">
            文章列表
          </h1>
          <p className="text-sm text-ink/60">
            共 {allPosts.length} 篇文章
          </p>
          
          <div className="divider mt-6">
            <span className="divider-text">✦</span>
          </div>
        </header>

        {/* 文章列表（带搜索和标签筛选） */}
        {allPosts.length > 0 ? (
          <PostListClient posts={allPosts} />
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">暂无文章，正在努力创作中...</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
