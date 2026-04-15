import Link from 'next/link'
import { socialLinks, siteConfig } from '@/lib/config'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-mist/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* 装饰性分隔 */}
        <div className="divider mb-8">
          <span className="divider-text">◆</span>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {/* 签名 */}
          <div className="text-center">
            <p className="text-sm text-ink/60 tracking-wide-custom">
              {siteConfig.motto}
            </p>
            <p className="text-xs text-ink/40 mt-2">
              © {currentYear} {siteConfig.author}. 用心记录每一天.
            </p>
          </div>

          {/* 社交链接 */}
          <div className="flex items-center space-x-4">
            <a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink/40 hover:text-ink-dark transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            </a>
            <a
              href={`mailto:${socialLinks.email}`}
              className="text-ink/40 hover:text-ink-dark transition-colors"
              aria-label="Email"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
