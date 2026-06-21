import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { supervisionRelations, profiles } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { validateBody } from "@/lib/validations/validate";
import { createSupervisionSchema } from "@/lib/validations/supervise";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const data = await db.query.supervisionRelations.findMany({
      where: and(
        eq(supervisionRelations.adminUserId, auth.user.id),
        eq(supervisionRelations.active, true),
      ),
      with: { supervised: true },
      orderBy: desc(supervisionRelations.createdAt),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取监督关系");
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await validateBody(request, createSupervisionSchema);
    if (body instanceof NextResponse) return body;

    const targetProfiles = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, body.supervisedUserId))
      .limit(1);

    if (!targetProfiles.length) {
      return NextResponse.json({ success: false, error: "目标用户不存在" }, { status: 404 });
    }

    const existing = await db
      .select({ id: supervisionRelations.id })
      .from(supervisionRelations)
      .where(
        and(
          eq(supervisionRelations.adminUserId, auth.user.id),
          eq(supervisionRelations.supervisedUserId, body.supervisedUserId),
          eq(supervisionRelations.active, true),
        ),
      )
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ success: false, error: "已监督该用户" }, { status: 409 });
    }

    const result = await db
      .insert(supervisionRelations)
      .values({
        adminUserId: auth.user.id,
        supervisedUserId: body.supervisedUserId,
        active: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "添加监督关系");
  }
}
