# Redis 缓存 — 集成 Redis 缓存提升性能

## 项目上下文

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL)
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 现有工具库：`src/lib/`（包含 `api-auth.ts`、`supabase-browser.ts`、`utils.ts`）
- API Routes（需要集成缓存的）：
  - `src/app/api/records/route.ts` — GET 获取记录列表（支持 dimension/from/to/limit 查询参数）
  - `src/app/api/records/[id]/route.ts` — GET 获取单条记录
  - `src/app/api/goals/route.ts` — GET 获取目标列表
  - `src/app/api/goals/[id]/route.ts` — GET 获取单个目标
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 当前仅支持暗色主题

## 任务目标

使用 ioredis 或 @upstash/redis 集成 Redis 缓存，为热门 API 查询结果添加缓存层，减少数据库查询压力，提升响应速度。

## 实施步骤

### 1. 选择 Redis 客户端并安装

**方案 A：ioredis（自建 Redis）**
```bash
pnpm add ioredis
```

**方案 B：@upstash/redis（Upstash 托管 Redis，适合 Serverless）**
```bash
pnpm add @upstash/redis
```

> 推荐方案 A（ioredis），因为项目使用 Supabase，可以通过 Supabase 的 Redis 扩展或自建 Redis 实例。如果使用 Vercel 部署，方案 B 更合适。

### 2. 创建 `src/lib/redis.ts` — Redis 客户端

```typescript
// src/lib/redis.ts
// Redis 客户端 — 单例模式，避免重复创建连接

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

/**
 * 获取 Redis 客户端实例（单例）
 * 在开发环境中如果 REDIS_URL 未配置，返回 null
 */
export function getRedisClient(): Redis | null {
  // 如果没有配置 Redis URL，返回 null（优雅降级）
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ REDIS_URL 未配置，缓存功能已禁用");
    }
    return null;
  }

  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // 重试 3 次后放弃
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("Redis 连接错误:", err.message);
    });

    redis.on("connect", () => {
      console.log("Redis 已连接");
    });
  }

  return redis;
}
```

### 3. 创建 `src/lib/cache.ts` — 通用缓存工具

```typescript
// src/lib/cache.ts
// 通用缓存工具 — get/set/del + JSON 序列化

import { getRedisClient } from "./redis";

const DEFAULT_TTL = 300; // 默认缓存 5 分钟（秒）

/**
 * 从缓存获取数据
 * @param key 缓存键
 * @returns 反序列化后的数据，未命中返回 null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`缓存读取失败 [${key}]:`, error);
    return null;
  }
}

/**
 * 写入缓存
 * @param key 缓存键
 * @param value 要缓存的数据
 * @param ttl 过期时间（秒），默认 300 秒（5 分钟）
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
  } catch (error) {
    console.error(`缓存写入失败 [${key}]:`, error);
  }
}

/**
 * 删除缓存
 * @param key 缓存键（支持通配符 *）
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // 如果包含通配符，使用 SCAN + DEL
    if (key.includes("*")) {
      const stream = redis.scanStream({ match: key, count: 100 });
      const keys: string[] = [];

      for await (const batch of stream) {
        keys.push(...(batch as string[]));
      }

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(key);
    }
  } catch (error) {
    console.error(`缓存删除失败 [${key}]:`, error);
  }
}

/**
 * 带缓存的查询执行器
 * 先查缓存，未命中则执行 fetcher，将结果写入缓存后返回
 *
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param ttl 缓存过期时间（秒）
 * @returns 数据
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // 尝试从缓存获取
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行查询
  const data = await fetcher();

  // 写入缓存（异步，不阻塞返回）
  cacheSet(key, data, ttl).catch(console.error);

  return data;
}

/**
 * 生成缓存键
 * 格式：{prefix}:{userId}:{params}
 */
export function cacheKey(prefix: string, userId: string, params?: string): string {
  return params
    ? `growthmind:${prefix}:${userId}:${params}`
    : `growthmind:${prefix}:${userId}`;
}
```

### 4. 在 records GET API 中集成缓存

需要先读取 `src/app/api/records/route.ts`（当前内容见项目上下文），修改 GET 函数：

```typescript
// src/app/api/records/route.ts
// 在 GET 函数中添加缓存逻辑

import { withCache, cacheKey, cacheDel } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);

    // 构建缓存键
    const dimension = searchParams.get("dimension") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const limit = searchParams.get("limit") || "50";
    const cacheParams = `d:${dimension}|f:${from}|t:${to}|l:${limit}`;
    const key = cacheKey("records", auth.user.id, cacheParams);

    // 使用缓存
    const data = await withCache(
      key,
      async () => {
        const db = getSupabaseClient(auth.token);
        let query = db
          .from("records")
          .select("*")
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: false });

        if (dimension) {
          query = query.eq("time_dimension", dimension);
        }
        if (from && to) {
          query = query.gte("record_date", from).lte("record_date", to);
        }

        const { data, error } = await query.limit(parseInt(limit));
        if (error) throw error;
        return data;
      },
      300 // 缓存 5 分钟
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取记录失败" },
      { status: 500 }
    );
  }
}
```

### 5. 在 records POST 中清除缓存

修改 `src/app/api/records/route.ts` 的 POST 函数，创建/更新记录后清除相关缓存：

```typescript
// 在 POST 函数中，成功创建后清除缓存
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const db = getSupabaseClient(auth.token);

    const { data, error } = await db.from("records").insert({
      // ... 插入逻辑
    }).select().single();

    if (error) throw error;

    // 清除该用户的所有 records 缓存
    await cacheDel(cacheKey("records", auth.user.id, "*"));

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "创建记录失败" },
      { status: 500 }
    );
  }
}
```

### 6. 在 goals GET API 中集成缓存

需要先读取 `src/app/api/goals/route.ts`（当前内容见项目上下文），以相同方式修改 GET 和 POST 函数。

### 7. 在 records/[id] 和 goals/[id] 中集成缓存

需要先读取 `src/app/api/records/[id]/route.ts` 和 `src/app/api/goals/[id]/route.ts`，以相同方式为单条记录查询添加缓存。

### 8. 配置环境变量

在 `.env.local` 中添加：
```bash
REDIS_URL=redis://localhost:6379
```

> 如果使用 Upstash，URL 格式为：`redis://default:password@host:port`

### 9. 验证 Redis 缓存

```bash
cd /Users/jahangir/workspace/GrowthMind/projects
pnpm install
pnpm build
pnpm ts-check
```

验证方法：
- 启动 Redis 服务（`redis-server`）
- 第一次请求 API，检查 Redis 中是否有新缓存键
- 第二次请求相同 API，应在 Redis 中命中缓存，响应更快
- 创建新记录后，检查相关缓存键是否被清除

## 代码示例

### 缓存策略总结

| 数据类型 | 缓存键格式 | TTL | 清除时机 |
|---------|-----------|-----|---------|
| 记录列表 | `growthmind:records:{userId}:d:{dim}\|f:{from}\|t:{to}\|l:{limit}` | 5 分钟 | 创建/更新/删除记录 |
| 单条记录 | `growthmind:record:{userId}:{recordId}` | 5 分钟 | 更新/删除该记录 |
| 目标列表 | `growthmind:goals:{userId}` | 5 分钟 | 创建/更新/删除目标 |
| 单个目标 | `growthmind:goal:{userId}:{goalId}` | 5 分钟 | 更新/删除该目标 |

### 缓存降级策略

如果 Redis 不可用（`REDIS_URL` 未配置或连接失败），所有缓存操作优雅降级，直接查询数据库，不抛出异常。

## 验收标准

- [ ] `ioredis` 或 `@upstash/redis` 正确安装
- [ ] `src/lib/redis.ts` 创建完成，单例模式，支持优雅降级
- [ ] `src/lib/cache.ts` 创建完成，支持 get/set/del/withCache
- [ ] `src/app/api/records/route.ts` 的 GET 函数已集成缓存
- [ ] `src/app/api/records/route.ts` 的 POST 函数在创建后清除缓存
- [ ] `src/app/api/goals/route.ts` 的 GET 函数已集成缓存
- [ ] `src/app/api/goals/route.ts` 的 POST 函数在创建后清除缓存
- [ ] `src/app/api/records/[id]/route.ts` 的 GET 函数已集成缓存
- [ ] `src/app/api/goals/[id]/route.ts` 的 GET 函数已集成缓存
- [ ] 缓存键命名规范，包含用户 ID 隔离
- [ ] Redis 不可用时优雅降级，不影响正常功能
- [ ] `pnpm build` 构建成功
- [ ] `pnpm ts-check` 类型检查通过

## 预估工时

1.5 人天

## 依赖

无 — 全部可并行