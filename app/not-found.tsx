import Link from 'next/link'
import Layout from '@/components/Layout'
import { siteConfig } from '@/lib/config'

export const metadata = {
  title: '页面未找到',
}

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <div className="text-center">
          {/* 水墨风大字 */}
          <p className="text-7xl md:text-8xl font-zhserif text-ink/15 select-none" aria-hidden>
            四零四
          </p>
          <h1 className="mt-6 text-2xl md:text-3xl font-zhserif text-ink-dark tracking-wide">
            此页无痕
          </h1>
          <p className="mt-4 text-sm md:text-base text-ink/60 leading-relaxed max-w-md mx-auto">
            你寻找的页面已随墨迹散去，或许从未存在。
            不如回到首页，看看文章与教程。
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/" className="btn-classic inline-block">
              返回首页
            </Link>
            <Link
              href="/projects#books"
              className="btn-classic inline-block"
            >
              逛逛教程
            </Link>
          </div>
          <p className="mt-10 text-xs text-ink/30 tracking-widest">
            {siteConfig.motto}
          </p>
        </div>
      </div>
    </Layout>
  )
}
