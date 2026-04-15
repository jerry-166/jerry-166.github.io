import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 古风淡雅配色
        ink: {
          light: '#e8e6e3',    // 淡墨色（背景）
          DEFAULT: '#5c5c5c',  // 墨色（正文）
          dark: '#3a3a3a',    // 深墨色
        },
        rice: {
          light: '#faf9f7',   // 米白（主背景）
          DEFAULT: '#f5f3ef', // 浅米色
          warm: '#ebe8e2',    // 暖米色
        },
        bamboo: {
          light: '#e8ede9',   // 淡竹青
          DEFAULT: '#a8b5a0', // 竹青色
          dark: '#7a8a72',    // 深竹青
        },
        mist: {
          light: '#f0efed',   // 薄雾色
          DEFAULT: '#d4d3d0', // 雾色
        }
      },
      fontFamily: {
        // 使用系统衬线字体模拟古风感
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // 使用系统无衬线字体保证可读性
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // 中文衬线字体
        zhserif: ['Noto Serif SC', 'STSong', 'SimSun', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'prose': '65ch',
      },
      letterSpacing: {
        'wide-custom': '0.08em',
      }
    },
  },
  plugins: [],
}

export default config
