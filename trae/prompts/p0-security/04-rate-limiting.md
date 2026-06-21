# API 频率限制

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- **技术栈**：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **后端**：Supabase (Auth + PostgreSQL) + Drizzle ORM
- **包管理**：pnpm（严禁 npm/yarn）
- **项目路径**：`/Users/jahangir/workspace/GrowthMind/projects/`
- **源码目录**：`src/`，API Routes 在 `src/app/api/`
- **中间件**：`src/middleware.ts`（已实现角色守卫和 API 鉴权）
- **API 鉴权**：`src/lib/api-auth.ts`（authenticateRequest 函数）

### 当前中间件结构

`src/middleware.ts` 当前处理逻辑：
1. 跳过静态资源（`/_next`、`/favicon`、图片文件）
2. 跳过 `/api/supabase-config`
3. 鉴权检查（基于 cookie 中的 access token）
4. Admin 路由角色守卫（`/supervise`、`/gateway`）

中间件 matcher 配置：
```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
```

## 任务目标

为关键 API 端点添加基于内存的请求频率限制，防止暴力破解和滥用。

## 实施步骤

### 步骤 1：读取现有中间件文件

先读取 `src/middleware.ts` 了解当前中间件实现，确保新增的频率限制逻辑与现有逻辑兼容。

### 步骤 2：创建 `src/lib/rate-limit.ts`

```typescript
/**
 * 基于内存的请求频率限制器（原型阶段）
 *
 * 注意：此实现使用内存存储，适用于单实例部署。
 * 生产环境应迁移到 Redis 或其他分布式存储方案。
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // 重置时间戳（毫秒）
}

interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// 存储结构：`${ip}:${path}` → RateLimitEntry
const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每 5 分钟）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * 检查请求是否超过频率限制
 *
 * @param key - 限流键（如 IP + 路径）
 * @param config - 限流配置
 * @returns 限流结果
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // 首次请求或已过期
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // 增加计数
  entry.count += 1;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * 从请求中提取客户端 IP 地址
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

// 限流配置
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 登录接口：每 15 分钟 5 次（防暴力破解）
  "/api/login": {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // AI 分析接口：每分钟 10 次
  "/api/analysis": {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // AI 网关接口：每分钟 10 次
  "/api/gateway": {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
};

// 默认限制：每分钟 60 次
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

/**
 * 获取路径对应的限流配置
 */
function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  for (const [prefix, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pathname.startsWith(prefix)) {
      return config;
    }
  }
  // 其他 API 路由使用默认配置
  if (pathname.startsWith("/api/")) {
    return DEFAULT_RATE_LIMIT;
  }
  // 非 API 路由不限制
  return null;
}

/**
 * 对请求应用频率限制，返回 NextResponse 或 null（通过检查）
 *
 * @param request - 请求对象
 * @returns 如果被限流返回 429 响应，否则返回 null
 */
export function applyRateLimit(request: Request): Response | null {
  const { pathname } = new URL(request.url);
  const config = getRateLimitConfig(pathname);

  // 不在限流范围内的路由，直接放行
  if (!config) return null;

  const ip = getClientIp(request);
  const key = `${ip}:${pathname}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        success: false,
        error: "请求过于频繁，请稍后重试",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
```

### 步骤 3：在 `src/middleware.ts` 中集成频率限制

在 `src/middleware.ts` 中添加频率限制检查。在现有的静态资源跳过逻辑之后、鉴权检查之前插入：

```typescript
import { applyRateLimit } from "@/lib/rate-limit";

// 在 middleware 函数中，"Skip static assets" 块之后添加：

// 频率限制检查（在鉴权之前，防止暴力破解）
const rateLimitResponse = applyRateLimit(request);
if (rateLimitResponse) {
  return rateLimitResponse;
}
```

完整的修改位置示意：

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API config
  if (
    pathname.startsWith("/_next") ||
    // ... 现有逻辑
  ) {
    return NextResponse.next();
  }

  // ====== 新增：频率限制检查 ======
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  // ====== 新增结束 ======

  // Get Supabase session from cookies
  // ... 现有逻辑保持不变
}
```

### 步骤 4：验证

1. 启动开发服务器：`pnpm dev`
2. 快速连续发送请求到 `/api/records` 验证是否在第 61 次请求时返回 429
3. 快速连续发送请求到 `/api/analysis` 验证是否在第 11 次请求时返回 429
4. 检查 429 响应是否包含 `Retry-After` header

## 验收标准

- [ ] `src/lib/rate-limit.ts` 已创建，包含完整的频率限制逻辑
- [ ] `src/middleware.ts` 已集成频率限制检查，在鉴权之前执行
- [ ] 普通 API 路由限制为每分钟 60 次
- [ ] AI 分析接口（`/api/analysis`、`/api/gateway`）限制为每分钟 10 次
- [ ] 被限流时返回 429 状态码和 `Retry-After` header
- [ ] 响应中包含 `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset` headers
- [ ] 静态资源和非 API 路由不受频率限制影响
- [ ] 过期条目定期清理，避免内存泄漏
- [ ] 运行 `pnpm ts-check` 无类型错误
- [ ] 运行 `pnpm lint` 无 lint 错误

## 预估工时

0.5 人天