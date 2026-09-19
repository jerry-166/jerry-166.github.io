import type { Metadata } from 'next'
import { Suspense } from 'react'
import Layout from '@/components/Layout'
import ExamListClient from '@/components/ExamListClient'
import { getSortedExamsData } from '@/lib/exams'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `笔试复盘 - ${siteConfig.title}`,
  description: `按公司与考点沉淀 ${siteConfig.author} 的各场笔试复盘`,
}

export default function ExamsPage() {
  // build 时扫描 content/exams/，新丢入的 md 文件自动出现在列表里
  const exams = getSortedExamsData()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark mb-2">笔试复盘</h1>
          <p className="text-sm text-ink/60">共 {exams.length} 场 · 按公司或考点两种视角回顾</p>

          <div className="divider mt-6">
            <span className="divider-text">✦</span>
          </div>
        </header>

        {exams.length > 0 ? (
          /* Suspense：ExamListClient 用 useSearchParams 读 ?topic= 直达考点视图，
             静态导出下必须包一层 Suspense 边界 */
          <Suspense fallback={null}>
            <ExamListClient exams={exams} />
          </Suspense>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink/50">暂无笔试复盘，做完一场加一场。</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
