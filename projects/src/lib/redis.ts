import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === "development") console.warn("REDIS_URL 未配置，缓存已禁用");
    return null;
  }
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        return times > 3 ? null : Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    redis.on("error", (err: Error) => console.error("Redis 错误:", err.message));
  }
  return redis;
}
