import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";

/**
 * 获取当前用户的 profile 信息
 * GET /api/profile?userId=xxx
 * 普通用户只能查询自己的 profile，管理员可通过 userId 参数查询他人
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorizedResponse();

    const userId = request.nextUrl.searchParams.get("userId") || auth.user.id;

    // 非本人查询需要管理员权限
    if (userId !== auth.user.id) {
      const ownProfile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, auth.user.id))
        .limit(1);
      if (!ownProfile[0] || ownProfile[0].role !== "admin") {
        return NextResponse.json(
          { success: false, error: "无权访问他人资料" },
          { status: 403 }
        );
      }
    }

    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return NextResponse.json({ success: true, data: result[0] || null });
  } catch (error) {
    return handleApiError(error, "获取用户资料");
  }
}