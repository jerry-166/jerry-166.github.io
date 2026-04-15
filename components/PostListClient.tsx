'use client'

import { useState, useMemo, useEffect } from 'react'
import PostCard from '@/components/PostCard'

interface Post {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
}

interface PostListClientProps {
  posts: Post[]
}

export default function PostListClient({ posts }: PostListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // 收集所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [posts])

  // 过滤文章
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = !activeTag || post.tags?.includes(activeTag)

      return matchesSearch && matchesTag
    })
  }, [posts, searchQuery, activeTag])

  // ESC 清除筛选
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('')
        setActiveTag(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const hasFilters = searchQuery || activeTag

  return (
    <div>
      {/* 搜索栏 + 标签筛选 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题、描述或标签..."
            className="w-full pl-10 pr-4 py-2.5 bg-rice border border-mist/60 rounded-sm text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-bamboo/50 focus:ring-1 focus:ring-bamboo/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
              aria-label="清除搜索"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-3 py-1.5 rounded-sm transition-all duration-200 ${
                !activeTag
                  ? 'bg-ink/10 text-ink-dark font-medium'
                  : 'bg-mist/30 text-ink/50 hover:text-ink/70'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-sm transition-all duration-200 ${
                  activeTag === tag
                    ? 'bg-bamboo/15 text-bamboo-dark font-medium'
                    : 'bg-mist/30 text-ink/50 hover:text-ink/70'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 当前筛选状态 */}
      {hasFilters && (
        <div className="mb-4 text-xs text-ink/40">
          找到 {filteredPosts.length} 篇文章
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveTag(null)
            }}
            className="ml-3 text-bamboo-dark hover:text-bamboo transition-colors"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 文章列表 */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-ink/50 mb-2">没有找到匹配的文章</p>
          {hasFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveTag(null)
              }}
              className="text-sm text-bamboo hover:text-bamboo-dark transition-colors"
            >
              查看全部文章
            </button>
          )}
        </div>
      )}
    </div>
  )
}
