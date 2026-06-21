import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { validateBody } from "@/lib/validations/validate";
import { createGoalSchema } from "@/lib/validations/goals";
import { cacheGet, cacheSet, buildCacheKey } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const cacheKey = buildCacheKey("goals", auth.user.id);
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const data = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, auth.user.id))
      .orderBy(desc(goals.createdAt));

    await cacheSet(cacheKey, data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取目标列表");
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await validateBody(request, createGoalSchema);
    if (body instanceof NextResponse) return body;

    const result = await db
      .insert(goals)
      .values({
        userId: auth.user.id,
        name: body.name,
        dimension: body.dimension,
        metric: body.metric,
        targetValue: body.targetValue,
        currentValue: body.currentValue,
        deadline: body.deadline,
        status: "active",
      })
      .returning();

    const { cacheDel } = await import("@/lib/cache");
    await cacheDel(`growthmind:goals:${auth.user.id}*`);

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建目标");
  }
}
