import Link from 'next/link'

interface Post {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
}

interface FeaturedCardProps {
  post: Post
}

export default function FeaturedCard({ post }: FeaturedCardProps) {
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
        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 bg-bamboo/10 text-bamboo-dark rounded-sm tracking-wide-custom"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 标题 - 大号 */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors mb-3 leading-snug font-zhserif">
          {post.title}
        </h2>

        {/* 描述 */}
        {post.description && (
          <p className="text-sm md:text-base text-ink/70 leading-relaxed line-clamp-3 mb-4">
            {post.description}
          </p>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <time className="text-xs text-ink/40 tracking-wide-custom">
            {formatDate(post.date)}
          </time>
          <span className="text-sm text-bamboo opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            阅读全文 →
          </span>
        </div>
      </Link>
    </article>
  )
}
