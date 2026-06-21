import { getRedisClient } from "./redis";

const DEFAULT_TTL = 300; // 5 分钟

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // 缓存写入失败不抛出异常
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // 缓存删除失败不抛出异常
  }
}

export function buildCacheKey(
  prefix: string,
  userId: string,
  params?: Record<string, string>,
): string {
  const paramStr = params
    ? ":" +
      Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return `growthmind:${prefix}:${userId}${paramStr}`;
}
