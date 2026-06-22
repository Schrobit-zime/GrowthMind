import { NextRequest } from "next/server";

/**
 * 限流配置接口
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

/**
 * 获取客户端 IP 地址
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * 懒加载 Redis 客户端（仅在服务端运行时可用，Edge Runtime 中返回 null）
 */
async function getRedisClient() {
  // Edge Runtime 不支持 ioredis，直接返回 null
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") {
    return null;
  }
  try {
    const { getRedisClient } = await import("@/lib/redis");
    return getRedisClient();
  } catch {
    return null;
  }
}

/**
 * 应用限流检查（基于 Redis 分布式限流）
 * Redis 不可用时放行，避免阻塞正常请求
 * Edge Runtime 中自动降级为内存限流（简单 Map 实现）
 * @returns true 表示允许放行，false 表示已达限流阈值
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      // 开发环境放宽限流阈值（10 倍），避免热重载时误触发
      const devConfig: RateLimitConfig =
        process.env.NODE_ENV === "development"
          ? { windowMs: config.windowMs, max: config.max * 10 }
          : config;
      return applyMemoryRateLimit(request, devConfig);
    }

    const ip = getClientIp(request);
    const key = `ratelimit:${ip}:${config.windowMs}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }
    return count <= config.max;
  } catch {
    // Redis 操作失败时降级为内存限流
    return applyMemoryRateLimit(request, config);
  }
}

/**
 * 内存限流（Edge Runtime 降级方案）
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * 清理过期条目，防止内存泄漏
 */
function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetAt) {
      memoryStore.delete(key);
    }
  }
}

// 每 30 秒清理一次过期条目（仅在 Node.js 环境中启用定时器）
if (
  typeof setInterval !== "undefined" &&
  typeof globalThis?.process?.versions?.node !== "undefined"
) {
  const interval = setInterval(cleanupMemoryStore, 30_000);
  if (typeof interval === "object" && "unref" in interval) {
    interval.unref();
  }
}

function applyMemoryRateLimit(request: NextRequest, config: RateLimitConfig): boolean {
  const ip = getClientIp(request);
  const key = `ratelimit:${ip}:${config.windowMs}`;
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  entry.count++;
  return entry.count <= config.max;
}
