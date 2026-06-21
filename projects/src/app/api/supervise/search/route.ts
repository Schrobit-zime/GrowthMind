import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { or, sql } from "drizzle-orm";
import { z } from "zod";

/** 搜索用户查询参数校验 */
const searchSchema = z.object({
  q: z.string().min(2, "搜索关键字至少2个字符"),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const rawQ = request.nextUrl.searchParams.get("q");
    const parsed = searchSchema.safeParse({ q: rawQ });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "参数无效" },
        { status: 400 }
      );
    }

    const q = parsed.data.q;
    const pattern = `%${q}%`;

    const users = await db
      .select({
        userId: profiles.userId,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(
        or(
          sql`${profiles.displayName} ILIKE ${pattern}`,
          sql`${profiles.userId}::text ILIKE ${pattern}`
        )
      )
      .limit(10);

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleApiError(error, "搜索用户");
  }
}
