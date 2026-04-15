'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h2 className="text-2xl font-zhserif text-ink-dark mb-4">出错了</h2>
      <p className="text-ink/60 mb-6">抱歉，页面加载时出现了问题。</p>
      <button
        onClick={() => reset()}
        className="btn-classic"
      >
        重试
      </button>
    </div>
  )
}
