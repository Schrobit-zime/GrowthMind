import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, desc, inArray } from "drizzle-orm";
import { handleApiError } from "@/lib/errors";

const { reminderRules, records, goals } = schema;

/** 提醒规则行类型 */
type ReminderRule = typeof reminderRules.$inferSelect;

/** 规则条件联合类型 */
type NoRecordCondition = { days?: number };
type GoalLaggingCondition = { threshold?: number };
type MoodDropCondition = { days?: number };

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
 * 批量检查「无记录」规则：一次查询所有受监督用户，消除 N+1 问题
 */
async function checkNoRecordRules(
  rules: ReminderRule[],
): Promise<{ ruleId: string; triggered: boolean }[]> {
  // 使用最大天数一次性查询覆盖所有规则
  const maxDays = Math.max(
    ...rules.map((r) => {
      const cond = r.condition as NoRecordCondition;
      return cond?.days ?? 3;
    }),
  );
  const since = new Date();
  since.setDate(since.getDate() - maxDays);
  const sinceStr = since.toISOString().split("T")[0];
  const userIds = [...new Set(rules.map((r) => r.supervisedUserId))];

  const recent = await db
    .select({ userId: records.userId, recordDate: records.recordDate })
    .from(records)
    .where(and(inArray(records.userId, userIds), gte(records.recordDate, sinceStr)));

  // 按用户分组记录日期
  const recordsByUser = new Map<string, Set<string>>();
  for (const r of recent) {
    if (!recordsByUser.has(r.userId)) recordsByUser.set(r.userId, new Set());
    recordsByUser.get(r.userId)!.add(r.recordDate);
  }

  return rules.map((rule) => {
    const cond = rule.condition as NoRecordCondition;
    const ruleDays = cond?.days ?? 3;
    const ruleSince = new Date();
    ruleSince.setDate(ruleSince.getDate() - ruleDays);
    const ruleSinceStr = ruleSince.toISOString().split("T")[0];

    const userDates = recordsByUser.get(rule.supervisedUserId);
    if (!userDates) return { ruleId: rule.id, triggered: true };
    const hasRecent = Array.from(userDates).some((d) => d >= ruleSinceStr);
    return { ruleId: rule.id, triggered: !hasRecent };
  });
}

/**
 * 批量检查「目标滞后」规则：一次查询所有活跃目标，消除 N+1 问题
 */
async function checkGoalLaggingRules(
  rules: ReminderRule[],
): Promise<{ ruleId: string; triggered: boolean }[]> {
  const userIds = [...new Set(rules.map((r) => r.supervisedUserId))];

  const activeGoals = await db
    .select()
    .from(goals)
    .where(and(inArray(goals.userId, userIds), eq(goals.status, "active")));

  // 按用户分组目标
  const goalsByUser = new Map<string, typeof activeGoals>();
  for (const g of activeGoals) {
    if (!goalsByUser.has(g.userId)) goalsByUser.set(g.userId, []);
    goalsByUser.get(g.userId)!.push(g);
  }

  return rules.map((rule) => {
    const cond = rule.condition as GoalLaggingCondition;
    const threshold = cond?.threshold ?? 0.5;
    const userGoals = goalsByUser.get(rule.supervisedUserId) ?? [];
    const isLagging = userGoals.some(
      (g) => g.targetValue !== 0 && g.currentValue / g.targetValue < threshold,
    );
    return { ruleId: rule.id, triggered: isLagging };
  });
}

/**
 * 批量检查「情绪持续下降」规则：一次查询所有情绪记录，消除 N+1 问题
 */
async function checkMoodDropRules(
  rules: ReminderRule[],
): Promise<{ ruleId: string; triggered: boolean }[]> {
  // 使用最大天数一次性查询覆盖所有规则
  const maxDays = Math.max(
    ...rules.map((r) => {
      const cond = r.condition as MoodDropCondition;
      return cond?.days ?? 5;
    }),
  );
  const since = new Date();
  since.setDate(since.getDate() - maxDays);
  const sinceStr = since.toISOString().split("T")[0];
  const userIds = [...new Set(rules.map((r) => r.supervisedUserId))];

  const moods = await db
    .select({
      userId: records.userId,
      moodScore: records.moodScore,
      recordDate: records.recordDate,
    })
    .from(records)
    .where(and(inArray(records.userId, userIds), gte(records.recordDate, sinceStr)))
    .orderBy(desc(records.recordDate));

  // 按用户分组情绪记录
  const moodsByUser = new Map<string, { moodScore: number | null; recordDate: string }[]>();
  for (const m of moods) {
    if (!moodsByUser.has(m.userId)) moodsByUser.set(m.userId, []);
    moodsByUser.get(m.userId)!.push(m);
  }

  return rules.map((rule) => {
    const cond = rule.condition as MoodDropCondition;
    const ruleDays = cond?.days ?? 5;
    const ruleSince = new Date();
    ruleSince.setDate(ruleSince.getDate() - ruleDays);
    const ruleSinceStr = ruleSince.toISOString().split("T")[0];

    const userMoods = (moodsByUser.get(rule.supervisedUserId) ?? []).filter(
      (m) => m.recordDate >= ruleSinceStr,
    );

    if (userMoods.length < 3) return { ruleId: rule.id, triggered: false };

    let dropping = true;
    for (let i = 1; i < userMoods.length; i++) {
      const prev = userMoods[i - 1].moodScore;
      const curr = userMoods[i].moodScore;
      if (prev === null || curr === null || curr >= prev) {
        dropping = false;
        break;
      }
    }

    return { ruleId: rule.id, triggered: dropping };
  });
}

/**
 * 根据规则配置的 actions 发送通知
 * 当前为占位实现，后续可扩展为真实通知通道
 */
function sendNotification(rule: ReminderRule, ruleType: string): void {
  const actions = (rule.actions as string[]) ?? [];
  for (const action of actions) {
    switch (action) {
      case "notify_admin":
        console.log(
          `[提醒] admin=${rule.adminUserId} 用户=${rule.supervisedUserId} 触发: ${ruleType}`,
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
 * Cron 触发端点：按规则类型分组批量查询，Promise.all 并行处理，消除 N+1 问题
 * 需携带 Authorization: Bearer <CRON_SECRET> 请求头（非开发环境）
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  try {
    const rules = await db.select().from(reminderRules).where(eq(reminderRules.enabled, true));

    if (!rules.length) {
      return NextResponse.json({
        success: true,
        data: { totalRules: 0, triggeredRules: 0 },
      });
    }

    // 按 ruleType 分组，以便批量查询
    const rulesByType = new Map<string, ReminderRule[]>();
    for (const rule of rules) {
      if (!rulesByType.has(rule.ruleType)) rulesByType.set(rule.ruleType, []);
      rulesByType.get(rule.ruleType)!.push(rule);
    }

    // Promise.all 并行处理所有规则类型
    const checkResults = await Promise.all(
      Array.from(rulesByType.entries()).map(async ([ruleType, rulesOfType]) => {
        switch (ruleType) {
          case "no_record":
            return checkNoRecordRules(rulesOfType);
          case "goal_lagging":
            return checkGoalLaggingRules(rulesOfType);
          case "mood_drop":
            return checkMoodDropRules(rulesOfType);
          default:
            return [];
        }
      }),
    );

    const allResults = checkResults.flat();

    // 为触发规则的发送通知
    const triggeredResults = allResults.filter((r) => r.triggered);
    for (const result of triggeredResults) {
      const rule = rules.find((r) => r.id === result.ruleId);
      if (rule) {
        sendNotification(rule, rule.ruleType);
      }
    }

    const results = allResults.map((r) => {
      const rule = rules.find((rule) => rule.id === r.ruleId);
      return {
        ruleId: r.ruleId,
        ruleType: rule?.ruleType ?? "unknown",
        triggered: r.triggered,
        actions: (rule?.actions as string[]) ?? [],
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRules: rules.length,
        triggeredRules: triggeredResults.length,
        results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "提醒检查");
  }
}
