# Jerry's Blog - 墨染秋毫

一个淡雅古风风格的个人博客，专注于 AI、RAG 和 Agent 技术的学习记录。

![古风水墨](https://img.shields.io/badge/风格-古风淡雅-5c5c5c?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)

## 特色

- 🎨 **古风淡雅**：淡墨色、浅灰、米白、淡青配色
- ✨ **水墨留白**：大量留白，呼吸感强
- 📱 **响应式设计**：移动端和桌面端都优雅
- ⚡ **Next.js 14**：使用 App Router，最新技术栈
- 📝 **Markdown 写作**：使用 Markdown 格式写文章

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── page.tsx          # 首页
│   ├── posts/            # 文章相关页面
│   │   ├── page.tsx     # 文章列表页
│   │   └── [slug]/       # 文章详情页
│   └── about/            # 关于页
├── components/           # React 组件
│   ├── Header.tsx       # 顶部导航
│   ├── Footer.tsx       # 底部
│   ├── Layout.tsx       # 布局组件
│   └── PostCard.tsx     # 文章卡片
├── content/posts/        # Markdown 文章
│   └── *.md             # 文章文件
├── lib/                  # 工具函数
│   ├── posts.ts         # 文章处理
│   └── config.ts        # 站点配置
└── public/              # 静态资源
```

## 添加文章

在 `content/posts/` 目录下创建 Markdown 文件：

```markdown
---
title: 文章标题
date: 2024-01-01
description: 文章简介
tags: [标签1, 标签2]
author: Jerry
---

文章正文内容...
```

## 自定义配置

编辑 `lib/config.ts` 修改站点信息：

```typescript
export const siteConfig = {
  name: 'Jerry\'s Blog',
  title: '墨染秋毫',
  description: '站点描述',
  author: 'Jerry',
  motto: '道阻且长，行则将至',
}
```

## 配色方案

| 名称 | 用途 | 色值 |
|------|------|------|
| 墨色 | 正文 | #5c5c5c |
| 深墨 | 标题 | #3a3a3a |
| 米白 | 主背景 | #faf9f7 |
| 浅米 | 卡片背景 | #f5f3ef |
| 竹青 | 强调色 | #a8b5a0 |
| 薄雾 | 边框/分割 | #d4d3d0 |

## 后续计划

- [ ] 添加评论功能
- [ ] 添加搜索功能
- [ ] 添加标签筛选
- [ ] 添加阅读量统计
- [ ] 添加 RSS 订阅
- [ ] 添加后端 API

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **文章格式**: Markdown + gray-matter + remark
- **字体**: Noto Serif SC (中文) + Inter (英文)

## License

MIT License - 供 Jerry 个人使用

---

*道阻且长，行则将至。* 🚀
