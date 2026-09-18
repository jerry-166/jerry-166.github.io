'use client'

import { useState } from 'react'
import { tutorialBooks, TutorialBook, bookCategories } from '@/lib/config'

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

// 教程手册折叠面板：按系列分组，每个系列可独立展开/收起
export default function BooksAccordion() {
  // 各系列展开状态，默认全部展开，方便首屏纵览
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bookCategories.map((c) => [c.key, true]))
  )

  return (
    <div className="divide-y divide-mist/50 border-y border-mist/50">
      {bookCategories.map((cat) => {
        const books = tutorialBooks.filter((b) => b.category === cat.key)
        if (books.length === 0) return null
        // 全局书脊编号：统计排在当前系列之前的所有手册数量作为偏移
        const offset = tutorialBooks.filter(
          (b) =>
            bookCategories.findIndex((c) => c.key === b.category) <
            bookCategories.findIndex((c) => c.key === cat.key)
        ).length
        const isOpen = open[cat.key]

        return (
          <section key={cat.key} aria-label={cat.label}>
            {/* 系列 header：整行可点击切换展开/收起 */}
            <button
              type="button"
              onClick={() => setOpen((m) => ({ ...m, [cat.key]: !m[cat.key] }))}
              aria-expanded={isOpen}
              aria-controls={`books-panel-${cat.key}`}
              className="w-full flex items-center gap-3 py-4 text-left group"
            >
              <h3 className="text-base font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors">
                {cat.label}
              </h3>
              <span className="text-xs text-ink/40">{books.length} 册</span>
              <span className="flex-1 h-px bg-mist/50" aria-hidden />
              <span className="text-xs text-ink/40 mr-1 hidden sm:inline">
                {isOpen ? '点击收起' : '点击展开'}
              </span>
              {/* 箭头：展开时旋转 180° */}
              <svg
                className={`w-4 h-4 text-ink/40 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* 折叠内容：grid-template-rows 0fr→1fr 实现平滑高度过渡，无需测量 DOM */}
            <div
              id={`books-panel-${cat.key}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              {/* overflow-hidden 是 0fr 折叠技巧的必要配合 */}
              <div className="overflow-hidden min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  {books.map((book, i) => (
                    <BookCard key={book.href} book={book} index={offset + i} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
