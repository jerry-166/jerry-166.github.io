import Link from 'next/link'

interface Post {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
}

interface PostCardProps {
  post: Post
  showDescription?: boolean
}

export default function PostCard({ post, showDescription = true }: PostCardProps) {
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
    <article className="card-classic group cursor-pointer">
      <Link href={`/posts/${post.slug}`} className="block">
        {/* 标题 */}
        <h2 className="text-lg md:text-xl font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors mb-2">
          {post.title}
        </h2>

        {/* 日期 */}
        <time className="text-xs text-ink/50 tracking-wide-custom">
          {formatDate(post.date)}
        </time>

        {/* 描述 */}
        {showDescription && post.description && (
          <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-2">
            {post.description}
          </p>
        )}

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-mist/50 text-ink/60 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 阅读更多指示 */}
        <div className="mt-4 text-sm text-bamboo opacity-0 group-hover:opacity-100 transition-opacity">
          阅读全文 →
        </div>
      </Link>
    </article>
  )
}
