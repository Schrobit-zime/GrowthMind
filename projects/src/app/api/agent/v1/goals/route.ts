import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

/** Agent 目标创建简化校验 */
const agentGoalSchema = z.object({
  name: z.string().min(1, "目标名称不能为空").max(200),
  dimension: z.enum(["learning", "work", "life", "health", "mood"]),
  metric: z.string().min(1).max(50),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).optional().default(0),
  deadline: z.string().nullable().optional(),
});

/** GET /api/agent/v1/goals — 获取目标列表 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const data = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, auth.user.id))
      .orderBy(desc(goals.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取目标列表");
  }
}

/** POST /api/agent/v1/goals — 创建新目标 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = agentGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "请求参数无效" },
        { status: 400 },
      );
    }

    const { name, dimension, metric, targetValue, currentValue, deadline } = parsed.data;

    const [result] = await db
      .insert(goals)
      .values({
        userId: auth.user.id,
        name,
        dimension,
        metric,
        targetValue,
        currentValue,
        deadline,
        status: "active",
      })
      .returning();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建目标");
  }
}
