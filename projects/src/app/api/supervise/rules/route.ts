import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminderRules } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { validateBody } from "@/lib/validations/validate";
import { createReminderRuleSchema } from "@/lib/validations/supervise";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const supervisedUserId = searchParams.get("supervised_user_id");

    const data = await db
      .select()
      .from(reminderRules)
      .where(eq(reminderRules.adminUserId, auth.user.id))
      .orderBy(desc(reminderRules.createdAt));

    const filtered = supervisedUserId
      ? data.filter((r) => r.supervisedUserId === supervisedUserId)
      : data;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    return handleApiError(error, "获取规则列表");
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await validateBody(request, createReminderRuleSchema);
    if (body instanceof NextResponse) return body;

    const result = await db
      .insert(reminderRules)
      .values({
        adminUserId: auth.user.id,
        supervisedUserId: body.supervisedUserId,
        ruleType: body.ruleType,
        condition: body.condition,
        actions: body.actions,
        enabled: body.enabled,
      })
      .returning();

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "创建规则");
  }
}
