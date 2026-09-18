'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navLinks, siteConfig } from '@/lib/config'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-rice-light/80 backdrop-blur-sm border-b border-mist/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* 站点标题 */}
          <Link 
            href="/" 
            className="group flex flex-col items-start"
          >
            <span className="text-xl md:text-2xl font-zhserif text-ink-dark tracking-wide-custom group-hover:text-bamboo-dark transition-colors">
              {siteConfig.title}
            </span>
            <span className="text-xs text-ink/50 tracking-widest hidden sm:block">
              {siteConfig.motto}
            </span>
            {/* 整站访问量：不蒜子统计，脚本全局加载（见 app/layout.tsx），
                数据返回前 display:none，脚本加载失败时保持隐藏，不显示 "undefined" */}
            <span
              id="busuanzi_container_site_pv"
              className="text-xs text-ink/50 tracking-widest"
              style={{ display: 'none' }}
            >
              访问量 <span id="busuanzi_value_site_pv" /> 次
            </span>
          </Link>

          {/* 导航：移动端 6 项需收紧字号与间距，sm 起恢复舒适间距 */}
          <nav className="flex items-center gap-0.5 sm:space-x-1 md:space-x-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-1.5 sm:px-3 py-2 text-xs sm:text-sm md:text-base tracking-wide-custom
                    transition-colors duration-200
                    ${isActive
                      ? 'text-bamboo-dark font-medium'
                      : 'text-ink/60 hover:text-ink-dark'
                    }
                  `}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
