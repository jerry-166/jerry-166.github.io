// ==================================================================
// /api/annotations — 划线批注的云端持久化接口（供 anno.js v3 调用）
// ------------------------------------------------------------------
// 存储：Upstash Redis（Vercel Marketplace 里的 Upstash 集成，
//   即原 "Vercel KV" 的继任者），每个页面一条记录：
//   key   = "anno:" + 页面文件名（如 anno:03-oop.html）
//   value = { page, items: Annotation[], updatedAt }
//
// GET  /api/annotations?page=xxx          → 开放读取（学习笔记不敏感）
// POST /api/annotations { page, items, baseUpdatedAt, token }
//   → 需要口令（= 环境变量 ANNO_WRITE_TOKEN），防路人乱写
//   → 乐观锁：云端版本比客户端所知的新（baseUpdatedAt 落后）→ 409，
//     客户端收到 409 会自动"拉云端 + 合并本地未推送项"后重推
//
// 环境变量：
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//     ← 在 Vercel → Storage → Upstash 创建并连接项目后自动注入
//   ANNO_WRITE_TOKEN ← 自定义写口令（自己起一个随机串）
// ==================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

interface Annotation {
  id: string;
  color?: string;
  note?: string;
  text?: string;
  [k: string]: unknown;
}

interface CloudRecord {
  page: string;
  items: Annotation[];
  updatedAt: number;
}

/** 合法页面名：字母/数字/下划线/点/横杠，≤120 字符（防注入奇怪 key） */
const PAGE_RE = /^[\w.-]{1,120}$/;
const MAX_ITEMS = 500;             // 单页批注数上限
const MAX_BODY_BYTES = 512 * 1024; // 请求体上限 512KB

/** CORS：读开放、写靠口令保护，因此放开所有来源（本地 file:// 打开也能同步） */
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * 懒初始化 Redis 客户端：首次用到时才读环境变量。
 * 为什么不用模块顶层直接 Redis.fromEnv()？——那会在环境变量缺失时
 * 于模块加载期就抛异常（next build 阶段可能被导入），这里改为
 * 缺配置时返回 null → 接口回 503 → 前端 anno.js 自动降级为仅本地模式。
 *
 * 环境变量命名兼容两种来源（优先级从高到低）：
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN ← Upstash 官网直连创建的库
 *   KV_REST_API_URL / KV_REST_API_TOKEN                ← Vercel Marketplace 集成注入的库
 */
let _redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  // 容错清理：去掉值两端可能的引号/反引号/空白（复制粘贴进 Vercel 时容易带上）
  const clean = (v?: string) =>
    v ? v.trim().replace(/^["'`]+/, '').replace(/["'`]+$/, '') : '';
  const url = clean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
  const token = clean(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// ---------- 读取：GET /api/annotations?page=xxx ----------
export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '';
  if (!PAGE_RE.test(page)) return json({ error: 'bad page' }, 400);

  const redis = getRedis();
  if (!redis) return json({ error: 'redis not configured' }, 503);

  try {
    const data = await redis.get<CloudRecord>('anno:' + page);
    return json(data ?? { page, items: [], updatedAt: 0 });
  } catch {
    // 连接异常（网络/凭证失效）→ 503，前端自动降级仅本地
    return json({ error: 'redis unavailable' }, 503);
  }
}

// ---------- 写入：POST /api/annotations ----------
export async function POST(req: NextRequest) {
  const expectToken = process.env.ANNO_WRITE_TOKEN;
  if (!expectToken) return json({ error: 'write token not configured' }, 503);

  const redis = getRedis();
  if (!redis) return json({ error: 'redis not configured' }, 503);

  // 解析请求体（限大小）
  let body: {
    page?: unknown; items?: unknown; token?: unknown;
    baseUpdatedAt?: unknown; updatedAt?: unknown;
  };
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  // 口令校验：body.token 或 Authorization: Bearer xxx（anno.js 走 body）
  const token = String(body.token ?? '')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (token !== expectToken) return json({ error: 'unauthorized' }, 401);

  // 参数校验
  const page = String(body.page ?? '');
  if (!PAGE_RE.test(page)) return json({ error: 'bad page' }, 400);
  const items = body.items;
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    return json({ error: 'bad items' }, 400);
  }

  const key = 'anno:' + page;
  try {
    // 乐观锁：云端已有更新的版本，而客户端基于旧版本 → 拒绝并让客户端拉新
    const existing = await redis.get<CloudRecord>(key);
    const base = typeof body.baseUpdatedAt === 'number' ? body.baseUpdatedAt : -1;
    if (existing && typeof existing.updatedAt === 'number' && existing.updatedAt > base) {
      return json({ error: 'conflict' }, 409);
    }
    const updatedAt = Date.now();
    await redis.set(key, { page, items, updatedAt } satisfies CloudRecord);
    return json({ ok: true, updatedAt });
  } catch {
    return json({ error: 'redis unavailable' }, 503);
  }
}
