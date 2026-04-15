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
          </Link>

          {/* 导航 */}
          <nav className="flex items-center space-x-1 md:space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== '/' && pathname.startsWith(link.href))
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-3 py-2 text-sm md:text-base tracking-wide-custom
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
