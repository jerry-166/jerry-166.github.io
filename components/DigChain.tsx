'use client'

import { useEffect, useState } from 'react'

// 深挖详情页的追问链：左侧轨道 + 节点，问题常显（原话预排版），
// 回答默认折叠——先自己答，再展开对照。

interface ChainStep {
  index: number
  round: number
  kind: 'initial' | 'followup'
  question: string
  answerHtml: string
}

export default function DigChain({ steps }: { steps: ChainStep[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})

  // 深链直达：#step-3 进来时自动展开目标一问
  useEffect(() => {
    const m = window.location.hash.match(/^#step-(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (steps.some((s) => s.index === n)) {
        setOpen((prev) => ({ ...prev, [n]: true }))
      }
    }
  }, [steps])

  const allOpen = steps.length > 0 && steps.every((s) => open[s.index])
  const toggle = (n: number) => setOpen((prev) => ({ ...prev, [n]: !prev[n] }))
  const setAll = (v: boolean) => {
    const next: Record<number, boolean> = {}
    for (const s of steps) next[s.index] = v
    setOpen(next)
  }
  const jumpTo = (n: number) => {
    setOpen((prev) => ({ ...prev, [n]: true }))
    requestAnimationFrame(() => {
      document.getElementById(`step-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div>
      {/* 链导航 + 自测开关 */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink/40 mr-1">链</span>
        {steps.map((s) => (
          <button
            key={s.index}
            onClick={() => jumpTo(s.index)}
            title={`第 ${s.round} 轮 · ${s.kind === 'initial' ? '初始' : '追问'}`}
            className={`text-xs w-7 h-7 rounded-full border transition-all duration-200 ${
              s.kind === 'initial'
                ? 'bg-bamboo text-rice border-bamboo'
                : 'bg-rice text-ink/60 border-bamboo/50 hover:border-bamboo hover:text-ink-dark'
            }`}
          >
            {s.index}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => setAll(!allOpen)}
          className="text-xs px-3 py-1.5 rounded-sm bg-mist/30 text-ink/50 hover:text-ink/70 hover:bg-ink/10 transition-all duration-200"
        >
          {allOpen ? '全部收起' : '全部展开'}
        </button>
      </div>

      {/* 追问链本体 */}
      <div className="relative">
        {/* 左侧轨道 */}
        <div
          className="absolute left-[9px] top-3 bottom-3 w-px bg-gradient-to-b from-bamboo/60 via-mist to-transparent"
          aria-hidden
        />
        <ol className="space-y-12">
          {steps.map((s) => (
            <li key={s.index} id={`step-${s.index}`} className="relative pl-8 md:pl-10 scroll-mt-24">
              {/* 节点 */}
              <span
                className={`absolute left-[5px] top-2 w-[9px] h-[9px] rounded-full ${
                  s.kind === 'initial' ? 'bg-bamboo' : 'bg-rice border border-bamboo/60'
                }`}
                aria-hidden
              />
              {/* 问：用户原话，预排版保真 */}
              <div className="bg-rice-warm/70 border border-mist/60 rounded-sm p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs px-1.5 py-0.5 bg-bamboo/15 text-bamboo-dark rounded-sm">
                    第 {s.round} 轮
                  </span>
                  <span className="text-xs text-ink/40">
                    {s.kind === 'initial' ? '初始一问' : `追问 ${s.index - 1}`}
                  </span>
                </div>
                <p className="text-sm md:text-[15px] leading-[1.9] text-ink whitespace-pre-wrap break-words">
                  {s.question}
                </p>
              </div>

              {/* 答：默认折叠，展开后渲染完整 Markdown */}
              <div className="mt-3">
                <button
                  onClick={() => toggle(s.index)}
                  className={`text-xs px-4 py-1.5 rounded-sm border transition-all duration-300 ${
                    open[s.index]
                      ? 'border-ink/30 text-ink/60 hover:border-ink/50'
                      : 'border-bamboo/50 text-bamboo-dark hover:bg-bamboo/10 hover:border-bamboo'
                  }`}
                >
                  {open[s.index] ? '收起回答 ▴' : '展开回答 ▾'}
                </button>
                {open[s.index] && (
                  <div
                    className="prose-classic mt-4 pt-4 border-t border-dashed border-mist/60 text-base"
                    dangerouslySetInnerHTML={{ __html: s.answerHtml }}
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-10 text-xs text-ink/30 text-center">
        自测模式：先看问题自己回答，再展开对照 —— 以理解记忆为主
      </p>
    </div>
  )
}
