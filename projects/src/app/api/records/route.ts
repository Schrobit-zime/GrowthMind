import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { records } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { validateBody } from "@/lib/validations/validate";
import { createRecordSchema } from "@/lib/validations/records";
import { handleApiError } from "@/lib/errors";
import { cacheGet, cacheSet, buildCacheKey } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);

    const dimension = searchParams.get("dimension");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "50");

    const cacheParams: Record<string, string> = { limit: String(limit) };
    if (dimension) cacheParams.dimension = dimension;
    if (from) cacheParams.from = from;
    if (to) cacheParams.to = to;

    const cacheKey = buildCacheKey("records", auth.user.id, cacheParams);
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const data = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.userId, auth.user.id),
          ...(dimension ? [eq(records.timeDimension, dimension)] : []),
          ...(from && to ? [and(gte(records.recordDate, from), lte(records.recordDate, to))] : []),
        ),
      )
      .orderBy(desc(records.createdAt))
      .limit(limit);

    await cacheSet(cacheKey, data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取记录列表");
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await validateBody(request, createRecordSchema);
    if (body instanceof NextResponse) return body;

    const result = await db
      .insert(records)
      .values({
        userId: auth.user.id,
        timeDimension: body.timeDimension,
        recordDate: body.recordDate,
        customLabel: body.customLabel,
        learning: body.learning,
        work: body.work,
        life: body.life,
        health: body.health,
        mood: body.mood,
        moodScore: body.moodScore,
        summary: body.summary,
        goalId: body.goalId,
      })
      .returning();

    const { cacheDel } = await import("@/lib/cache");
    await cacheDel(`growthmind:records:${auth.user.id}*`);

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建记录");
  }
}
