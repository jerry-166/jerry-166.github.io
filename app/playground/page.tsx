import type { Metadata } from 'next'
import Image from 'next/image'
import Layout from '@/components/Layout'
import { siteConfig, playgroundItems, PlaygroundItem } from '@/lib/config'

export const metadata: Metadata = {
  title: `玩物志 - ${siteConfig.title}`,
  description: `${siteConfig.author} 与 AI 结伴创作的闲趣小件：不为 KPI，只为「做出来会很好玩」`,
}

// 玩物志卡片：大封面陈列风格，期号徽章呼应作品自带的系列编号
function ToyCard({ toy }: { toy: PlaygroundItem }) {
  return (
    <article className="card-classic group relative overflow-hidden">
      {/* 左侧强调色条 */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 z-10 transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: toy.accent }}
        aria-hidden
      />

      <a href={toy.href} target="_blank" rel="noopener noreferrer" className="block pl-3">
        {/* 封面：object-cover 裁剪整页截图的插画主体区 */}
        <div className="relative mb-4 overflow-hidden rounded-sm border border-mist/40">
          <Image
            src={toy.cover}
            alt={toy.title}
            width={1200}
            height={600}
            className="w-full h-60 md:h-72 object-cover object-[center_35%] group-hover:scale-[1.03] transition-transform duration-500"
          />
          {/* 期号徽章 */}
          <span
            className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm border"
            style={{ borderColor: `${toy.accent}55`, color: toy.accent }}
          >
            {toy.edition}
          </span>
        </div>

        {/* 标题 */}
        <h2 className="text-lg md:text-xl font-medium text-ink-dark group-hover:text-bamboo-dark transition-colors leading-snug">
          {toy.title}
        </h2>

        {/* 简介 */}
        <p className="mt-2 text-sm text-ink/70 leading-relaxed">
          {toy.description}
        </p>

        {/* 标签 + 把玩引导 */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {toy.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-mist/40 text-ink/60 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-sm text-bamboo whitespace-nowrap flex items-center gap-1">
            在线把玩 →
          </span>
        </div>
      </a>
    </article>
  )
}

export default function PlaygroundPage() {
  return (
    <Layout>
      <div className="ink-wash absolute top-0 left-0 right-0 h-64 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* 页面标题 */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-zhserif text-ink-dark mb-4 tracking-wide">
            玩物志
          </h1>
          <p className="text-base text-ink/70 max-w-2xl mx-auto leading-relaxed">
            与 AI 结伴做的小实验：不为 KPI，只为「做出来会很好玩」。玩物未必丧志。
          </p>
          <div className="divider mt-8">
            <span className="divider-text">✦</span>
          </div>
        </section>

        {/* 作品陈列：单列大卡，更像小件展览 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-medium text-ink-dark">全部小件</h2>
            <span className="text-xs text-ink/50">共 {playgroundItems.length} 件</span>
          </div>
          <div className="space-y-8">
            {playgroundItems.map((toy) => (
              <ToyCard key={toy.href} toy={toy} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}
