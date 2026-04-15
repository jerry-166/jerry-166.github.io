import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '墨染秋毫',
  description: '探索AI与RAG的世界，记录成长的每一步',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
