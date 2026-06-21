import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { validateBody } from "@/lib/validations/validate";
import { updateGoalSchema } from "@/lib/validations/goals";
import { cacheGet, cacheSet, cacheDel, buildCacheKey } from "@/lib/cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;

    const cacheKey = buildCacheKey("goals", auth.user.id, { id });
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const data = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, auth.user.id)))
      .limit(1);

    if (!data.length) {
      return NextResponse.json({ success: false, error: "目标不存在" }, { status: 404 });
    }

    await cacheSet(cacheKey, data[0]);

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return handleApiError(error, "获取目标");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await validateBody(request, updateGoalSchema);
    if (body instanceof NextResponse) return body;

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.dimension !== undefined) updateData.dimension = body.dimension;
    if (body.metric !== undefined) updateData.metric = body.metric;
    if (body.targetValue !== undefined) updateData.targetValue = body.targetValue;
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue;
    if (body.deadline !== undefined) updateData.deadline = body.deadline;
    if (body.status !== undefined) updateData.status = body.status;

    const result = await db
      .update(goals)
      .set(updateData)
      .where(and(eq(goals.id, id), eq(goals.userId, auth.user.id)))
      .returning();

    if (!result.length) {
      return NextResponse.json({ success: false, error: "目标不存在" }, { status: 404 });
    }

    await cacheDel(`growthmind:goals:${auth.user.id}*`);

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return handleApiError(error, "更新目标");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;

    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, auth.user.id)));

    await cacheDel(`growthmind:goals:${auth.user.id}*`);

    return NextResponse.json({ success: true, message: "目标已删除" });
  } catch (error) {
    return handleApiError(error, "删除目标");
  }
}
