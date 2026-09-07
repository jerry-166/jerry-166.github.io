import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s - ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: [
    'Jerry',
    'RAG',
    'Agent',
    'LangChain',
    'FastAPI',
    '前端教程',
    'React 教程',
    'MySQL 教程',
    'MySQL 架构',
    '大模型应用开发',
    '个人博客',
  ],
  authors: [{ name: siteConfig.author }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: 'summary',
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
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
        {/* 不蒜子访问量统计：全局加载，为 Header 的整站访问量计数（afterInteractive 不阻塞首屏渲染） */}
        <Script
          src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
