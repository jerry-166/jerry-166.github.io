import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import BooksAccordion from '@/components/BooksAccordion'
import { siteConfig, tutorialBooks } from '@/lib/config'

export const metadata: Metadata = {
  title: `教程手册 - ${siteConfig.title}`,
  description: `${siteConfig.author} 自研编写的教程手册系列：前端系列与 Python 后端系列，自包含静态页面，支持在线交互演示`,
}

export default function BooksPage() {
  return (
    <Layout>
      <div className="ink-wash absolute top-0 left-0 right-0 h-64 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* 页面标题 */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-zhserif text-ink-dark mb-4 tracking-wide">
            教程手册
          </h1>
          <p className="text-base text-ink/70 max-w-2xl mx-auto leading-relaxed">
            自研编写的系列手册：先跑起来、再懂原理、最后谈架构。
            全部为自包含静态页面，手机/平板/电脑均可流畅阅读，支持直接交互演示。
          </p>
          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </section>

        {/* 分系列折叠面板：点击系列名可展开/收起 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark">全部分类</h2>
            <span className="text-xs text-ink/50">
              共 {tutorialBooks.length} 册 · 点击系列行展开/收起
            </span>
          </div>
          <BooksAccordion />
        </section>
      </div>
    </Layout>
  )
}
