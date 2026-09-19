#!/usr/bin/env node
/**
 * inject-anno.mjs —— 批量为教程书页面注入划线批注功能（CI 构建 step，幂等可重跑）
 *
 * 职责（三件事）：
 *   1. 同步 anno.js 副本：以 public/books/anno.js 为唯一权威源，复制到每个含
 *      HTML 的书目录 —— 页面用相对路径 src="anno.js" 引用，本地 file:// 打开也能用
 *   2. 注入 script 标签：在 </body> 前插 <script src="anno.js"></script>，
 *      已注入过的文件跳过（幂等：CI 反复跑不会重复插、不会产生空提交）
 *   3. 同名文件防串数据：若两个不同目录出现同名 HTML（如各书都有 index.html），
 *      自动注入 window.ANNO_CONFIG={page:'<目录/文件名>'} 做存储键命名空间隔离
 *
 * 设计约束：
 *   - 零依赖（只用 node:fs / node:path），CI 上无需 npm install
 *   - 保留各文件原有换行风格（CRLF/LF），避免整文件 diff
 *   - 只改 public/books 下的内容页；无 </body> 的畸形文件警告跳过，不炸 CI
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';

const ROOT = join(process.cwd(), 'public', 'books');
const CANONICAL = join(ROOT, 'anno.js'); // 权威源：更新 anno.js 只改这一个文件

/* ---------- 递归收集 public/books 下所有 HTML 文件 ---------- */
function walkHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkHtml(p));
    else if (extname(name).toLowerCase() === '.html') out.push(p);
  }
  return out;
}

const files = walkHtml(ROOT);
if (files.length === 0) {
  console.log('No HTML found under public/books, nothing to do.');
  process.exit(0);
}

/* ---------- 同名文件检测：生成需要命名空间隔离的页面集合 ----------
   存储键默认 = 文件名（anno:03-oop.html）。若两本书各有 index.html，
   键会撞车导致批注互串 —— 这些页面必须注入 page 覆盖 */
const byName = new Map();
for (const f of files) {
  const name = f.split(/[\\/]/).pop().toLowerCase();
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push(f);
}
const needNs = new Set();
for (const list of byName.values()) {
  if (list.length > 1) for (const f of list) needNs.add(f);
}

/* ---------- 逐文件处理 ---------- */
let injected = 0, skipped = 0, warned = 0;
const annoCopies = new Set(); // 记录哪些目录需要 anno.js 副本

for (const file of files) {
  let html = readFileSync(file, 'utf8');
  annoCopies.add(dirname(file));

  // 幂等：已引用过 anno.js 的文件直接跳过（含此前手工接入的 java-review）
  if (/src=["']anno\.js["']/.test(html)) { skipped++; continue; }

  // 定位最后一个 </body>（大小写不敏感；代码示例里的都已被转义，不会干扰）
  const m = html.toLowerCase().lastIndexOf('</body>');
  if (m === -1) {
    console.warn(`  ! 无 </body>，跳过: ${relative(process.cwd(), file)}`);
    warned++; continue;
  }

  // 同名文件 → 注入存储键命名空间（相对 public/books 的目录/文件名）
  const rel = relative(ROOT, file).replace(/\\/g, '/').replace(/\.html$/i, '');
  const ns = needNs.has(file)
    ? `<script>window.ANNO_CONFIG={page:'${rel}'};</script>\n`
    : '';

  // 保留原文件换行风格，避免整文件 diff
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const tag = `${ns}<script src="anno.js"></script>`;
  html = html.slice(0, m) + tag + eol + html.slice(m);
  writeFileSync(file, html);
  injected++;
  console.log(`  + ${relative(process.cwd(), file)}${needNs.has(file) ? '  (命名空间: ' + rel + ')' : ''}`);
}

/* ---------- 同步 anno.js 副本到各书目录 ---------- */
const src = readFileSync(CANONICAL);
let copied = 0;
for (const dir of annoCopies) {
  const dst = join(dir, 'anno.js');
  if (dir === ROOT) continue; // 权威源所在目录
  try {
    const same = readFileSync(dst).equals(src);
    if (same) continue;
  } catch { /* 目标不存在则复制 */ }
  writeFileSync(dst, src);
  copied++;
  console.log(`  = anno.js → ${relative(process.cwd(), dir)}/`);
}

console.log(`\n注入 ${injected} · 已存在跳过 ${skipped} · 警告 ${warned} · anno.js 同步 ${copied} 个目录`);
// 存在警告不视为失败（畸形文件不该阻塞其余页面的注入）
process.exit(0);
