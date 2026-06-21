import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminderRules } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { validateBody } from "@/lib/validations/validate";
import { updateReminderRuleSchema } from "@/lib/validations/supervise";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await validateBody(request, updateReminderRuleSchema);
    if (body instanceof NextResponse) return body;

    const updateData: Record<string, unknown> = {};
    if (body.ruleType !== undefined) updateData.ruleType = body.ruleType;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    const result = await db
      .update(reminderRules)
      .set(updateData)
      .where(and(eq(reminderRules.id, id), eq(reminderRules.adminUserId, auth.user.id)))
      .returning();

    if (!result.length) {
      return NextResponse.json({ success: false, error: "规则不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return handleApiError(error, "更新规则");
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

    await db
      .delete(reminderRules)
      .where(and(eq(reminderRules.id, id), eq(reminderRules.adminUserId, auth.user.id)));

    return NextResponse.json({ success: true, message: "规则已删除" });
  } catch (error) {
    return handleApiError(error, "删除规则");
  }
}
