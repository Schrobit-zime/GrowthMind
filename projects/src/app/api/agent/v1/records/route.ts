import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { records } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

/** Agent 记录创建简化校验：只需 timeDimension 和 recordDate，其余均为可选 */
const agentRecordSchema = z.object({
  timeDimension: z.enum([
    "weekly",
    "monthly",
    "semiannual",
    "annual",
    "morning",
    "noon",
    "evening",
    "quick_note",
    "custom",
  ]),
  recordDate: z.string().min(1, "日期不能为空"),
  customLabel: z.string().optional(),
  learning: z.record(z.string(), z.unknown()).optional().default({}),
  work: z.record(z.string(), z.unknown()).optional().default({}),
  life: z.record(z.string(), z.unknown()).optional().default({}),
  health: z.record(z.string(), z.unknown()).optional().default({}),
  mood: z.record(z.string(), z.unknown()).optional().default({}),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

/** GET /api/agent/v1/records — 获取记录列表 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const dimension = searchParams.get("dimension");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取记录列表");
  }
}

/** POST /api/agent/v1/records — 创建新记录（简化字段） */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = agentRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "请求参数无效" },
        { status: 400 },
      );
    }

    const {
      timeDimension,
      recordDate,
      customLabel,
      learning,
      work,
      life,
      health,
      mood,
      moodScore,
      summary,
      goalId,
    } = parsed.data;

    const [result] = await db
      .insert(records)
      .values({
        userId: auth.user.id,
        timeDimension,
        recordDate,
        customLabel,
        learning,
        work,
        life,
        health,
        mood,
        moodScore,
        summary,
        goalId,
      })
      .returning();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建记录");
  }
}
