import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import PostCard from '@/components/PostCard'
import FeaturedCard from '@/components/FeaturedCard'
import { getSortedPostsData } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import Link from 'next/link'

export const metadata: Metadata = {
  title: `${siteConfig.title} - ${siteConfig.description}`,
  description: siteConfig.description,
}

export default function Home() {
  const allPosts = getSortedPostsData()
  const [featuredPost, ...restPosts] = allPosts
  const recentPosts = restPosts.slice(0, 2) // 除了首篇外显示 2 篇

  return (
    <Layout>
      {/* 顶部水墨效果 */}
      <div className="ink-wash absolute top-0 left-0 right-0 h-64 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* 欢迎区域 */}
        <section className="text-center mb-16 md:mb-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-zhserif text-ink-dark mb-4 tracking-wide">
            欢迎来到 Jerry 的小站
          </h1>
          <p className="text-base md:text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
            记录技术学习与成长，探索 RAG 与 Agent 的无限可能
          </p>
          
          {/* 装饰线 */}
          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </section>

        {/* 最新文章 - 杂志式布局 */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark">
              最新文章
            </h2>
            <Link 
              href="/posts" 
              className="text-sm text-bamboo hover:text-bamboo-dark transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          {featuredPost ? (
            <div className="space-y-8">
              {/* 第一篇 - 大卡片 */}
              <FeaturedCard post={featuredPost} />

              {/* 后续文章 - 双列布局 */}
              {recentPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentPosts.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              )}

              {/* 如果还有更多文章 */}
              {allPosts.length > 3 && (
                <div className="text-center pt-4">
                  <Link 
                    href="/posts" 
                    className="btn-classic inline-block"
                  >
                    查看全部 {allPosts.length} 篇文章
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-ink/50">暂无文章，敬请期待...</p>
            </div>
          )}
        </section>

        {/* 关于简介 */}
        <section className="mt-16 md:mt-20">
          <div className="divider">
            <span className="divider-text">◆</span>
          </div>
          
          <div className="mt-10 text-center max-w-2xl mx-auto">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark mb-4">
              关于我
            </h2>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed mb-6">
              一名正在学习 AI 技术的学生，专注于 RAG 和 Agent 开发。
              热爱技术，享受探索的过程。
            </p>
            <Link 
              href="/about" 
              className="btn-classic inline-block"
            >
              了解更多
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
