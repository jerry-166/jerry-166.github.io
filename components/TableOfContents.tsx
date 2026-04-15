'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentId?: string // 文章内容容器的 DOM id
}

export default function TableOfContents({ contentId = 'article-content' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // 从 DOM 提取 rehype-slug 生成的实际 heading id
  useEffect(() => {
    const container = document.getElementById(contentId)
    if (!container) return

    const headingEls = container.querySelectorAll('h2, h3')
    const extracted: Heading[] = []

    headingEls.forEach((el) => {
      const id = el.id
      const text = el.textContent || ''
      const level = el.tagName === 'H2' ? 2 : 3
      if (id) {
        extracted.push({ id, text, level })
      }
    })

    setHeadings(extracted)
  }, [contentId])

  // 滚动高亮
  useEffect(() => {
    if (headings.length < 2) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting)
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => {
            const aRect = a.boundingClientRect
            const bRect = b.boundingClientRect
            return Math.abs(aRect.top) - Math.abs(bRect.top)
          })
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav
      className="hidden lg:block"
      aria-label="文章目录"
    >
      {/* 目录标题 */}
      <p className="text-xs text-ink/40 tracking-wide-custom mb-3 uppercase">
        目录
      </p>

      <ul className="space-y-1.5 border-l border-mist">
        {headings.map(({ id, text, level }) => {
          const isActive = activeId === id
          const isH3 = level === 3

          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(id)
                  if (el) {
                    const offset = 100
                    const top = el.getBoundingClientRect().top + window.scrollY
                    window.scrollTo({ top: top - offset, behavior: 'smooth' })
                  }
                }}
                className={`
                  block py-1 transition-all duration-300 text-sm
                  ${isH3 ? 'pl-6' : 'pl-4'}
                  ${isActive
                    ? 'text-bamboo-dark font-medium border-l-2 border-bamboo-dark -ml-px'
                    : 'text-ink/50 hover:text-ink-dark border-l-2 border-transparent -ml-px'
                  }
                `}
              >
                {text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
