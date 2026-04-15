'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // 首次渲染不触发动画
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayChildren(children)
      return
    }

    // 开始淡出
    setIsTransitioning(true)

    const timer = setTimeout(() => {
      setDisplayChildren(children)
      // 淡入
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={`transition-opacity duration-200 ease-in-out ${
        isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
      }`}
    >
      {displayChildren}
    </div>
  )
}
