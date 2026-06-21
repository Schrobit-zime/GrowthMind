# P1-06：提醒检查引擎

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

- 数据库 Schema：`src/storage/database/shared/schema.ts`（`reminderRules` 表定义）
- 提醒规则 API：`src/app/api/supervise/rules/route.ts`（规则 CRUD）
- 边缘计算配置文件：`vercel.json`（可能存在，用于配置 Vercel Cron）

### reminder_rules 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `adminUserId` | UUID | 监督者（admin）用户 ID |
| `supervisedUserId` | UUID | 被监督者用户 ID |
| `ruleType` | text | 规则类型：`no_record` / `goal_lagging` / `mood_drop` / `custom` |
| `condition` | JSONB | 触发条件（如 `{"days": 3}` 表示连续 3 天未记录） |
| `actions` | JSONB | 触发动作数组（如 `["notify_admin", "notify_user"]`） |
| `enabled` | boolean | 是否启用 |
| `createdAt` | timestamp | 创建时间 |
| `updatedAt` | timestamp | 更新时间 |

## 任务目标

实现提醒检查引擎，定期检查启用的提醒规则，判断是否触发条件，执行通知动作，并更新下次触发时间。

## 实施步骤

### 步骤 1：创建提醒检查 API 端点

**目标文件**：`src/app/api/cron/check-reminders/route.ts`

创建 GET 端点供定时任务调用：

```typescript
export async function GET(request: NextRequest) {
  // 1. 验证请求来源（CRON_SECRET）
  // 2. 查询所有 enabled 的提醒规则
  // 3. 逐一检查规则是否触发
  // 4. 执行通知动作
  // 5. 返回检查结果
}
```

### 步骤 2：实现规则检查逻辑

根据 `ruleType` 实现不同的检查逻辑：

#### 2.1 `no_record` — 连续未记录

查询被监督者最近 N 天（由 `condition.days` 指定）是否有记录：

```typescript
async function checkNoRecordRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const days = (rule.condition as { days: number }).days || 3;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const recentRecords = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.userId, rule.supervisedUserId),
        gte(records.recordDate, sinceStr)
      )
    )
    .limit(1);

  // 如果在指定天数内没有记录，则触发
  return recentRecords.length === 0;
}
```

#### 2.2 `goal_lagging` — 目标进度滞后

检查被监督者是否有目标进度严重滞后（低于预期进度）：

```typescript
async function checkGoalLaggingRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const threshold = (rule.condition as { threshold: number }).threshold || 0.5;

  const activeGoals = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, rule.supervisedUserId),
        eq(goals.status, "active")
      )
    );

  // 检查是否有目标进度低于阈值
  return activeGoals.some((goal) => {
    if (goal.targetValue === 0) return false;
    return goal.currentValue / goal.targetValue < threshold;
  });
}
```

#### 2.3 `mood_drop` — 心情持续下降

检查被监督者最近 N 天的心情分数是否持续下降：

```typescript
async function checkMoodDropRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const days = (rule.condition as { days: number }).days || 5;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const recentMoods = await db
    .select({ moodScore: records.moodScore, recordDate: records.recordDate })
    .from(records)
    .where(
      and(
        eq(records.userId, rule.supervisedUserId),
        gte(records.recordDate, sinceStr)
      )
    )
    .orderBy(desc(records.recordDate));

  if (recentMoods.length < 3) return false;

  // 检查心情分数是否持续下降
  let isDropping = true;
  for (let i = 1; i < recentMoods.length; i++) {
    const prev = recentMoods[i - 1].moodScore;
    const curr = recentMoods[i].moodScore;
    if (prev === null || curr === null || curr >= prev) {
      isDropping = false;
      break;
    }
  }

  return isDropping;
}
```

#### 2.4 `custom` — 自定义规则

为自定义规则预留扩展点，当前返回 `false`：

```typescript
async function checkCustomRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  // 自定义规则：根据 condition 中的自定义逻辑判断
  // 当前版本暂不实现，保留扩展点
  console.log(`自定义规则 ${rule.id} 暂未实现`);
  return false;
}
```

### 步骤 3：实现通知发送

```typescript
async function sendNotification(
  rule: typeof reminderRules.$inferSelect,
  ruleType: string
): Promise<void> {
  const actions = rule.actions as string[];

  for (const action of actions) {
    switch (action) {
      case "notify_admin":
        // 通知监督者
        console.log(
          `[通知] 监督者 ${rule.adminUserId}：被监督者 ${rule.supervisedUserId} 触发了 ${ruleType} 规则`
        );
        // TODO: 后续对接邮件/飞书/站内通知等渠道
        break;

      case "notify_user":
        // 通知被监督者
        console.log(
          `[通知] 用户 ${rule.supervisedUserId}：你触发了 ${ruleType} 提醒`
        );
        break;

      case "send_email":
        // 发送邮件
        console.log(
          `[邮件] 发送提醒邮件给 ${rule.supervisedUserId}`
        );
        // TODO: 后续对接邮件服务
        break;

      default:
        console.log(`[未知动作] ${action}`);
    }
  }
}
```

### 步骤 4：配置定时任务

**方案 A：Vercel Cron Jobs（推荐）**

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/check-reminders",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- `0 */6 * * *` 表示每 6 小时执行一次
- 生产环境可用更频繁的调度（如 `0 * * * *` 每小时）

**安全措施**：
- 在 Route Handler 中验证 `Authorization` 头或 `CRON_SECRET` 环境变量
- 确保只有 Vercel Cron 可以触发该端点

```typescript
// 验证 CRON 请求来源
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}
```

**方案 B：Supabase pg_cron（备选）**

如果使用 Supabase 托管数据库，可以使用 `pg_cron` 扩展：

```sql
-- 需要在 Supabase SQL Editor 中执行
SELECT cron.schedule(
  'check-reminders',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/check-reminders',
    headers := '{"Authorization": "Bearer your-cron-secret"}'::jsonb
  );
  $$
);
```

### 步骤 5：创建检查结果日志

在 API 响应中返回检查结果摘要：

```typescript
interface CheckResult {
  totalRules: number;
  triggeredRules: number;
  details: {
    ruleId: string;
    ruleType: string;
    triggered: boolean;
    actions: string[];
  }[];
}
```

## 代码示例

### 完整的 `src/app/api/cron/check-reminders/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";

const { reminderRules, records, goals } = schema;

/**
 * 验证 CRON 请求来源
 * 防止外部恶意调用
 */
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 开发环境跳过验证
  if (process.env.NODE_ENV === "development") return true;

  if (!cronSecret) {
    console.error("CRON_SECRET 环境变量未设置");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 检查"连续未记录"规则
 */
async function checkNoRecordRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const days = (rule.condition as { days?: number }).days || 3;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const recentRecords = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.userId, rule.supervisedUserId),
        gte(records.recordDate, sinceStr)
      )
    )
    .limit(1);

  return recentRecords.length === 0;
}

/**
 * 检查"目标进度滞后"规则
 */
async function checkGoalLaggingRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const threshold = (rule.condition as { threshold?: number }).threshold || 0.5;

  const activeGoals = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, rule.supervisedUserId),
        eq(goals.status, "active")
      )
    );

  return activeGoals.some((goal) => {
    if (goal.targetValue === 0) return false;
    return goal.currentValue / goal.targetValue < threshold;
  });
}

/**
 * 检查"心情持续下降"规则
 */
async function checkMoodDropRule(
  rule: typeof reminderRules.$inferSelect
): Promise<boolean> {
  const days = (rule.condition as { days?: number }).days || 5;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const recentMoods = await db
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

  if (recentMoods.length < 3) return false;

  let isDropping = true;
  for (let i = 1; i < recentMoods.length; i++) {
    const prev = recentMoods[i - 1].moodScore;
    const curr = recentMoods[i].moodScore;
    if (prev === null || curr === null || curr >= prev) {
      isDropping = false;
      break;
    }
  }

  return isDropping;
}

/**
 * 发送通知
 * 当前使用 console.log 占位，后续对接邮件/飞书等渠道
 */
async function sendNotification(
  rule: typeof reminderRules.$inferSelect,
  ruleType: string
): Promise<void> {
  const actions = (rule.actions as string[]) || [];

  for (const action of actions) {
    switch (action) {
      case "notify_admin":
        console.log(
          `[提醒通知] admin=${rule.adminUserId} → 用户 ${rule.supervisedUserId} 触发规则: ${ruleType}`
        );
        break;
      case "notify_user":
        console.log(
          `[提醒通知] 用户 ${rule.supervisedUserId} 触发规则: ${ruleType}`
        );
        break;
      case "send_email":
        console.log(
          `[邮件通知] 发送提醒邮件给用户 ${rule.supervisedUserId}`
        );
        break;
      default:
        console.log(`[未知通知动作] ${action}`);
    }
  }
}

/**
 * 提醒检查定时任务入口
 * GET /api/cron/check-reminders
 */
export async function GET(request: NextRequest) {
  // 验证请求来源
  if (!verifyCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: "未授权" },
      { status: 401 }
    );
  }

  try {
    // 查询所有启用的提醒规则
    const rules = await db
      .select()
      .from(reminderRules)
      .where(eq(reminderRules.enabled, true));

    if (rules.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRules: 0,
          triggeredRules: 0,
          message: "没有启用的提醒规则",
        },
      });
    }

    const results: {
      ruleId: string;
      ruleType: string;
      triggered: boolean;
      actions: string[];
    }[] = [];

    // 逐一检查规则
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
        case "custom":
          // 自定义规则：当前暂不实现
          triggered = false;
          break;
        default:
          console.log(`未知规则类型: ${rule.ruleType}`);
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

    const triggeredCount = results.filter((r) => r.triggered).length;

    return NextResponse.json({
      success: true,
      data: {
        totalRules: rules.length,
        triggeredRules: triggeredCount,
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
```

## 验收标准

- [ ] `src/app/api/cron/check-reminders/route.ts` 文件已创建
- [ ] 四种规则类型（no_record / goal_lagging / mood_drop / custom）的检查逻辑已实现
- [ ] 通知发送使用 console.log 占位（后续可对接邮件/飞书等渠道）
- [ ] API 端点有 CRON_SECRET 安全验证
- [ ] 手动调用 `GET /api/cron/check-reminders` 返回正确的检查结果
- [ ] 定时任务配置已添加到 `vercel.json`（或通过 Supabase pg_cron）
- [ ] 无 TypeScript 类型错误

## 预估工时

1.5 人天

## 依赖

无