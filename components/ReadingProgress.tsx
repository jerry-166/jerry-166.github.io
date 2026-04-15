'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  // 路由变化时重置
  useEffect(() => {
    setProgress(0)
    setVisible(false)
  }, [pathname])

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      setProgress(Math.min(scrollPercent, 100))
      setVisible(scrollTop > 100)
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  // 只在文章页显示
  if (!pathname.startsWith('/posts/')) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] h-0.5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-bamboo via-bamboo-dark to-bamboo transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
