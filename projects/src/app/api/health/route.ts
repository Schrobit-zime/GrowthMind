import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRedisClient } from "@/lib/redis";

/**
 * 健康检查端点
 * 用于负载均衡和监控探测服务状态
 */
export async function GET() {
  try {
    // 检查数据库连接
    await db.execute("SELECT 1");

    // 检查 Redis 连接（可选）
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        redis: redis ? "up" : "disabled",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
