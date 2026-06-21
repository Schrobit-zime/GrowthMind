import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";

const { reminderRules, records, goals } = schema;

/**
 * 验证 Cron 请求是否携带正确的 CRON_SECRET
 * 开发环境下跳过验证，生产环境验证 Bearer token
 */
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "development") return true;
  if (!cronSecret) {
    console.error("CRON_SECRET 未设置");
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 检查「无记录」规则：用户在指定天数内没有任何记录
 */
async function checkNoRecordRule(rule: any): Promise<boolean> {
  const days = (rule.condition as any)?.days || 3;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const recent = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.userId, rule.supervisedUserId),
        gte(records.recordDate, sinceStr)
      )
    )
    .limit(1);

  return recent.length === 0;
}

/**
 * 检查「目标滞后」规则：存在活跃目标当前进度低于阈值比例
 */
async function checkGoalLaggingRule(rule: any): Promise<boolean> {
  const threshold = (rule.condition as any)?.threshold || 0.5;

  const activeGoals = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, rule.supervisedUserId),
        eq(goals.status, "active")
      )
    );

  return activeGoals.some(
    (g) => g.targetValue !== 0 && g.currentValue / g.targetValue < threshold
  );
}

/**
 * 检查「情绪持续下降」规则：最近 N 天内情绪评分持续递减
 */
async function checkMoodDropRule(rule: any): Promise<boolean> {
  const days = (rule.condition as any)?.days || 5;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const moods = await db
    .select({
      moodScore: records.moodScore,
      recordDate: records.recordDate,
    })
    .from(records)
    .where(
      and(
        eq(records.userId, rule.supervisedUserId),
        gte(records.recordDate, sinceStr)
      )
    )
    .orderBy(desc(records.recordDate));

  if (moods.length < 3) return false;

  let dropping = true;
  for (let i = 1; i < moods.length; i++) {
    const prev = moods[i - 1].moodScore;
    const curr = moods[i].moodScore;
    if (prev === null || curr === null || curr >= prev) {
      dropping = false;
      break;
    }
  }

  return dropping;
}

/**
 * 根据规则配置的 actions 发送通知
 * 当前为占位实现，后续可扩展为真实通知通道
 */
async function sendNotification(rule: any, ruleType: string): Promise<void> {
  const actions = (rule.actions as string[]) || [];
  for (const action of actions) {
    switch (action) {
      case "notify_admin":
        console.log(
          `[提醒] admin=${rule.adminUserId} 用户=${rule.supervisedUserId} 触发: ${ruleType}`
        );
        break;
      case "notify_user":
        console.log(`[提醒] 用户 ${rule.supervisedUserId} 触发: ${ruleType}`);
        break;
      case "send_email":
        console.log(`[邮件] 发送提醒给 ${rule.supervisedUserId}`);
        break;
    }
  }
}

/**
 * GET /api/cron/check-reminders
 * Cron 触发端点：遍历所有启用的提醒规则并执行检查
 * 需携带 Authorization: Bearer <CRON_SECRET> 请求头（非开发环境）
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  try {
    const rules = await db
      .select()
      .from(reminderRules)
      .where(eq(reminderRules.enabled, true));

    if (!rules.length) {
      return NextResponse.json({
        success: true,
        data: { totalRules: 0, triggeredRules: 0 },
      });
    }

    const results: any[] = [];

    for (const rule of rules) {
      let triggered = false;

      switch (rule.ruleType) {
        case "no_record":
          triggered = await checkNoRecordRule(rule);
          break;
        case "goal_lagging":
          triggered = await checkGoalLaggingRule(rule);
          break;
        case "mood_drop":
          triggered = await checkMoodDropRule(rule);
          break;
        default:
          continue;
      }

      if (triggered) {
        await sendNotification(rule, rule.ruleType);
      }

      results.push({
        ruleId: rule.id,
        ruleType: rule.ruleType,
        triggered,
        actions: (rule.actions as string[]) || [],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRules: rules.length,
        triggeredRules: results.filter((r) => r.triggered).length,
        results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("提醒检查失败:", error);
    return NextResponse.json(
      { success: false, error: "提醒检查失败" },
      { status: 500 }
    );
  }
}
