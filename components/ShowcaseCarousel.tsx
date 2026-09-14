'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import type { ShowcaseItem } from '@/lib/config'

/**
 * 层级轮播（coverflow 风格）：
 * - 居中一张完整展示，两侧各一张缩小后退并被遮盖（半透明渐变 + 墨色蒙层）
 * - 左右按钮切换下一张 / 上一张；点击两侧图片可直接跳转
 * - 移动端仅展示居中一张，避免三张挤成一团
 */
export default function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // SSR 安全的移动端检测（挂载后再修正）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const prev = useCallback(
    () => setActive((i) => (i - 1 + items.length) % items.length),
    [items.length]
  )
  const next = useCallback(
    () => setActive((i) => (i + 1) % items.length),
    [items.length]
  )

  // 环形偏移：把索引差折算到 [-n/2, n/2]，|d|<=1 的三张可见
  const offsetOf = (i: number) => {
    const n = items.length
    let d = i - active
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }

  const activeItem = items[active]
  if (!activeItem) return null

  return (
    <div>
      {/* 图片层叠区 */}
      <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden select-none">
        {items.map((item, i) => {
          const d = offsetOf(i)
          const abs = Math.abs(d)
          // 超出 ±1 藏到幕后；移动端只留居中一张
          const hidden = abs > 1 || (isMobile && abs > 0)

          return (
            <button
              key={item.src}
              type="button"
              onClick={() => d !== 0 && setActive(i)}
              aria-label={`查看：${item.title}`}
              className="absolute inset-y-0 left-0 right-0 mx-auto w-[86%] md:w-[76%] rounded-sm overflow-hidden border border-mist/70 bg-rice shadow-sm transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
              style={{
                // 层级展示：两侧图片横向位移 + 缩小后退
                transform: `translateX(${d * 54}%) scale(${1 - abs * 0.16})`,
                opacity: hidden ? 0 : 1 - abs * 0.3,
                zIndex: 30 - abs * 10,
                pointerEvents: hidden ? 'none' : 'auto',
                cursor: d === 0 ? 'default' : 'pointer',
              }}
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 86vw, 76vw"
                className="object-cover"
                draggable={false}
                priority={i === 0}
              />
              {/* 两侧遮盖：非居中图片压一层渐变蒙层，进一步弱化 */}
              {abs > 0 && (
                <span
                  className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,249,247,0.75),rgba(232,230,227,0.35),rgba(250,249,247,0.75))]"
                  aria-hidden
                />
              )}
            </button>
          )
        })}

        {/* 左右切换按钮（悬于所有图片之上） */}
        <button
          type="button"
          onClick={prev}
          aria-label="上一张"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 md:w-11 md:h-11 rounded-full border border-mist bg-rice/90 backdrop-blur-sm flex items-center justify-center text-ink/70 hover:text-ink-dark hover:border-ink/30 hover:bg-rice-warm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="下一张"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 md:w-11 md:h-11 rounded-full border border-mist bg-rice/90 backdrop-blur-sm flex items-center justify-center text-ink/70 hover:text-ink-dark hover:border-ink/30 hover:bg-rice-warm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 容器两侧渐隐遮罩，与页面米白背景融为一体 */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 z-40 bg-gradient-to-r from-rice-light to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 z-40 bg-gradient-to-l from-rice-light to-transparent"
          aria-hidden
        />
      </div>

      {/* 当前图片说明 */}
      <div className="mt-5 text-center min-h-[3.75rem]">
        <p className="font-zhserif text-base md:text-lg text-ink-dark">{activeItem.title}</p>
        <p className="mt-1 text-sm text-ink/60 leading-relaxed">{activeItem.subtitle}</p>
      </div>

      {/* 指示点 */}
      <div className="mt-2 flex items-center justify-center gap-2.5">
        {items.map((item, i) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`第 ${i + 1} 张：${item.title}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-bamboo' : 'w-1.5 bg-mist hover:bg-ink/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
