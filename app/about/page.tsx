import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { siteConfig, socialLinks } from '@/lib/config'

export const metadata: Metadata = {
  title: `关于 - ${siteConfig.title}`,
  description: `关于 ${siteConfig.author} 的个人介绍`,
}

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 页面标题 */}
        <header className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-zhserif text-ink-dark mb-2">
            关于
          </h1>
          
          <div className="divider mt-6">
            <span className="divider-text">✦</span>
          </div>
        </header>

        {/* 关于内容 */}
        <div className="space-y-10">
          {/* 简介 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">你好</h2>
            <div className="prose-classic text-base">
              <p>
                我是 Jerry，一名计算机专业在读的学生，主攻
                <strong>后端开发</strong>与<strong>AI 应用开发</strong>方向，
                专注于 RAG（检索增强生成）与 Agent（智能体）的工程实践。
              </p>
              <p>
                这个博客用来记录我的学习笔记、项目经历和思考感悟。
                我把学习过程中整理的一整套教程手册（前端系列、MySQL
                架构串讲等）也放在了这里，
                希望能对你有一点点帮助。
              </p>
            </div>
          </section>

          {/* 技能 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">技术栈</h2>
            {[
              {
                label: '语言与框架',
                skills: ['Python', 'FastAPI', 'Pydantic', 'Java', 'Spring Boot'],
              },
              {
                label: '数据与中间件',
                skills: ['MySQL', 'Redis', 'MongoDB', 'Milvus'],
              },
              {
                label: 'AI 应用',
                skills: ['RAG', 'Agentic RAG', 'LangChain', 'LangGraph', 'Function Calling', 'MCP'],
              },
            ].map((group) => (
              <div key={group.label} className="mb-5 last:mb-0">
                <h3 className="text-sm text-ink/50 mb-2">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-mist/30 text-sm text-ink/70 rounded-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* 教程系列 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">教程手册</h2>
            <div className="prose-classic text-base">
              <p>
                从零开始学前端时，我整理了一套完整的教程手册：
                学习路线、概念与最小代码手册（三册）、以及 AI 时代知识金字塔；
                备战秋招时又编写了 MySQL 架构逻辑链串讲笔记，
                全部支持在线交互演示。
              </p>
            </div>
            <Link
              href="/projects#books"
              className="btn-classic inline-block mt-4 text-sm"
            >
              前往阅读 →
            </Link>
          </section>

          {/* 项目 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">项目经历</h2>
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-medium text-ink-dark mb-1">
                  IntelliKnowledge-RAG · 个人知识库
                </h3>
                <p className="text-sm text-ink/70">
                  基于 Agentic RAG 的个人知识库系统，支持文档问答与智能检索。
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-ink-dark mb-1">
                  mini-openclew · Agent 基础设施
                </h3>
                <p className="text-sm text-ink/70">
                  实现 Skill 机制、本地 Session 管理与数据库存储的迷你 Agent 框架。
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-ink-dark mb-1">
                  chat2work · 智能协作工具
                </h3>
                <p className="text-sm text-ink/70">
                  集成多种大语言模型能力的 AI Agent 应用。
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-ink-dark mb-1">
                  gold-price-briefing · 每日金价资讯系统
                </h3>
                <p className="text-sm text-ink/70">
                  自动化早报生成、教学内容与价格预警的完整资讯流水线。
                </p>
              </div>
            </div>
          </section>

          {/* 目标 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">秋招准备</h2>
            <div className="prose-classic text-base">
              <p>
                正在积极备战秋招，目标岗位是
                <strong>后端开发工程师</strong>与<strong>大模型应用开发</strong>方向。
              </p>
              <p>
                备考主线：计算机基础（数据结构 / 操作系统 / 网络 / MySQL / Redis）、
                大模型原理、RAG 技术、Agent 设计模式，兼顾项目深挖与八股复盘。
              </p>
            </div>
          </section>

          {/* 联系方式 */}
          <section className="card-classic">
            <h2 className="text-lg font-medium text-ink-dark mb-4">联系我</h2>
            <div className="space-y-3">
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-ink/70 hover:text-ink-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                GitHub
              </a>
              <a
                href={`mailto:${socialLinks.email}`}
                className="flex items-center gap-3 text-sm text-ink/70 hover:text-ink-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {socialLinks.email}
              </a>
            </div>
          </section>
        </div>

        {/* 底部签名 */}
        <div className="text-center mt-12">
          <p className="text-sm text-ink/50">
            {siteConfig.motto}
          </p>
        </div>
      </div>
    </Layout>
  )
}
