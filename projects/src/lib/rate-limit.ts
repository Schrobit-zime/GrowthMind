import { NextRequest } from "next/server";
import { getRedisClient } from "@/lib/redis";

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
 * 应用限流检查（基于 Redis 分布式限流）
 * Redis 不可用时放行，避免阻塞正常请求
 * @returns true 表示允许放行，false 表示已达限流阈值
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return true; // Redis 不可用时放行

  const ip = getClientIp(request);
  const key = `ratelimit:${ip}:${config.windowMs}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  return count <= config.max;
}