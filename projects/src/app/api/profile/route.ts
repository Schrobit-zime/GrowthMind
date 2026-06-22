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
        return NextResponse.json({ success: false, error: "无权访问他人资料" }, { status: 403 });
      }
    }

    let profile = (await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1))[0];

    // 查询自己的 profile，若不存在则自动创建；若存在且系统无 admin 则自动提升
    if (userId === auth.user.id) {
      if (!profile) {
        const email = auth.user.email || userId.slice(0, 8);
        const existingCount = await db.select().from(profiles).limit(1);
        const role = existingCount.length === 0 ? "admin" : "user";

        const [newProfile] = await db
          .insert(profiles)
          .values({ userId, displayName: email, role })
          .returning();
        profile = newProfile;
      } else if (profile.role !== "admin") {
        // 检查系统是否有 admin，若无则自动提升当前用户
        const [admin] = await db.select().from(profiles).where(eq(profiles.role, "admin")).limit(1);
        if (!admin) {
          const [updated] = await db
            .update(profiles)
            .set({ role: "admin" })
            .where(eq(profiles.userId, userId))
            .returning();
          profile = updated || profile;
        }
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return handleApiError(error, "获取用户资料");
  }
}
