import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { records } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { validateBody } from "@/lib/validations/validate";
import { updateRecordSchema } from "@/lib/validations/records";
import { cacheGet, cacheSet, cacheDel, buildCacheKey } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;

    const cacheKey = buildCacheKey("records", auth.user.id, { id });
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const data = await db
      .select()
      .from(records)
      .where(and(eq(records.id, id), eq(records.userId, auth.user.id)))
      .limit(1);

    if (!data.length) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    await cacheSet(cacheKey, data[0]);

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return handleApiError(error, "获取记录");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await validateBody(request, updateRecordSchema);
    if (body instanceof NextResponse) return body;

    const updateData: Record<string, unknown> = {};
    if (body.timeDimension !== undefined) updateData.timeDimension = body.timeDimension;
    if (body.recordDate !== undefined) updateData.recordDate = body.recordDate;
    if (body.customLabel !== undefined) updateData.customLabel = body.customLabel;
    if (body.learning !== undefined) updateData.learning = body.learning;
    if (body.work !== undefined) updateData.work = body.work;
    if (body.life !== undefined) updateData.life = body.life;
    if (body.health !== undefined) updateData.health = body.health;
    if (body.mood !== undefined) updateData.mood = body.mood;
    if (body.moodScore !== undefined) updateData.moodScore = body.moodScore;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.goalId !== undefined) updateData.goalId = body.goalId;

    const result = await db
      .update(records)
      .set(updateData)
      .where(and(eq(records.id, id), eq(records.userId, auth.user.id)))
      .returning();

    if (!result.length) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    await cacheDel(`growthmind:records:${auth.user.id}*`);

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return handleApiError(error, "更新记录");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;

    await db
      .delete(records)
      .where(and(eq(records.id, id), eq(records.userId, auth.user.id)));

    await cacheDel(`growthmind:records:${auth.user.id}*`);

    return NextResponse.json({ success: true, message: "记录已删除" });
  } catch (error) {
    return handleApiError(error, "删除记录");
  }
}
