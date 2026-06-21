# API 输入 Zod 验证

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- **技术栈**：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **后端**：Supabase (Auth + PostgreSQL) + Drizzle ORM
- **包管理**：pnpm（严禁 npm/yarn）
- **项目路径**：`/Users/jahangir/workspace/GrowthMind/projects/`
- **源码目录**：`src/`，API Routes 在 `src/app/api/`
- **中间件**：`src/middleware.ts`（已实现角色守卫和 API 鉴权）
- **API 鉴权**：`src/lib/api-auth.ts`（authenticateRequest 函数）
- **依赖**：`zod` v4.3.5 已安装，`drizzle-zod` v0.8.3 已安装

### 当前 API Routes 及其接收的字段

#### `src/app/api/records/route.ts`
- **POST** 接收字段：`timeDimension`, `recordDate`, `learning`, `work`, `life`, `health`, `mood`, `moodScore`, `summary`, `goalId`

#### `src/app/api/records/[id]/route.ts`
- **PUT** 接收字段：`timeDimension`, `recordDate`, `learning`, `work`, `life`, `health`, `mood`, `moodScore`, `summary`, `goalId`

#### `src/app/api/goals/route.ts`
- **POST** 接收字段：`name`, `dimension`, `metric`, `targetValue`, `currentValue`, `deadline`

#### `src/app/api/goals/[id]/route.ts`
- **PUT** 接收字段：`name`, `dimension`, `metric`, `targetValue`, `currentValue`, `deadline`, `status`

#### `src/app/api/supervise/route.ts`
- **POST** 接收字段：`supervisedUserId`

#### `src/app/api/supervise/rules/route.ts`
- **POST** 接收字段：`supervisedUserId`, `ruleType`, `condition`, `actions`, `enabled`

#### `src/app/api/supervise/rules/[id]/route.ts`
- **PUT** 接收字段：`ruleType`, `condition`, `actions`, `enabled`

## 任务目标

为所有 API Routes 的 POST/PUT 操作添加 Zod 输入验证，确保所有请求体数据经过严格校验，防止注入攻击和非法数据写入。

## 实施步骤

### 步骤 1：读取现有 API Route 文件

在执行前，请先读取以下文件确认当前代码：
- `src/app/api/records/route.ts`
- `src/app/api/records/[id]/route.ts`
- `src/app/api/goals/route.ts`
- `src/app/api/goals/[id]/route.ts`
- `src/app/api/supervise/route.ts`
- `src/app/api/supervise/rules/route.ts`
- `src/app/api/supervise/rules/[id]/route.ts`

### 步骤 2：创建验证 Schema 文件

创建 `src/lib/validations/` 目录，并创建以下文件：

#### 2.1 `src/lib/validations/records.ts`
```typescript
import { z } from "zod";

// 时间维度枚举
const TimeDimensionEnum = z.enum([
  "daily", "weekly", "monthly", "semiannual", "annual",
  "morning", "noon", "evening", "custom"
]);

// 维度 JSON 对象 Schema
const DimensionSchema = z.record(z.string(), z.unknown()).default({});

// 创建记录 Schema
export const createRecordSchema = z.object({
  timeDimension: TimeDimensionEnum,
  recordDate: z.string().min(1, "日期不能为空"),
  customLabel: z.string().optional(),
  learning: DimensionSchema,
  work: DimensionSchema,
  life: DimensionSchema,
  health: DimensionSchema,
  mood: DimensionSchema,
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

// 更新记录 Schema（所有字段可选）
export const updateRecordSchema = z.object({
  timeDimension: TimeDimensionEnum.optional(),
  recordDate: z.string().min(1).optional(),
  customLabel: z.string().optional(),
  learning: DimensionSchema.optional(),
  work: DimensionSchema.optional(),
  life: DimensionSchema.optional(),
  health: DimensionSchema.optional(),
  mood: DimensionSchema.optional(),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
```

#### 2.2 `src/lib/validations/goals.ts`
```typescript
import { z } from "zod";

const DimensionEnum = z.enum(["learning", "work", "life", "health", "mood"]);
const StatusEnum = z.enum(["active", "completed", "archived"]);

// 创建目标 Schema
export const createGoalSchema = z.object({
  name: z.string().min(1, "目标名称不能为空").max(200, "目标名称不能超过200字"),
  dimension: DimensionEnum,
  metric: z.string().min(1, "计量单位不能为空").max(50),
  targetValue: z.number().min(0, "目标值不能为负数"),
  currentValue: z.number().min(0).default(0),
  deadline: z.string().nullable().optional(),
});

// 更新目标 Schema
export const updateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dimension: DimensionEnum.optional(),
  metric: z.string().min(1).max(50).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  deadline: z.string().nullable().optional(),
  status: StatusEnum.optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
```

#### 2.3 `src/lib/validations/supervise.ts`
```typescript
import { z } from "zod";

const RuleTypeEnum = z.enum(["no_record", "goal_lagging", "mood_drop", "custom"]);

// 创建监督关系 Schema
export const createSupervisionSchema = z.object({
  supervisedUserId: z.string().uuid("用户ID格式无效"),
});

// 创建提醒规则 Schema
export const createReminderRuleSchema = z.object({
  supervisedUserId: z.string().uuid("用户ID格式无效"),
  ruleType: RuleTypeEnum,
  condition: z.record(z.string(), z.unknown()).default({}),
  actions: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

// 更新提醒规则 Schema
export const updateReminderRuleSchema = z.object({
  ruleType: RuleTypeEnum.optional(),
  condition: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export type CreateSupervisionInput = z.infer<typeof createSupervisionSchema>;
export type CreateReminderRuleInput = z.infer<typeof createReminderRuleSchema>;
export type UpdateReminderRuleInput = z.infer<typeof updateReminderRuleSchema>;
```

#### 2.4 `src/lib/validations/index.ts`
```typescript
export * from "./records";
export * from "./goals";
export * from "./supervise";
```

### 步骤 3：创建通用验证工具函数

创建 `src/lib/validations/validate.ts`：

```typescript
import { ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

/**
 * 验证请求体并返回解析后的数据
 * 验证失败时返回 400 响应，包含详细错误信息
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "输入数据验证失败",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      );
    }
    return result.data;
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体格式无效，请提供有效的 JSON" },
      { status: 400 }
    );
  }
}

/**
 * 格式化 Zod 错误为可读的键值对
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}
```

### 步骤 4：在 API Routes 中集成验证

以 `src/app/api/records/route.ts` 的 POST 为例，修改前：

```typescript
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    // ... 直接使用 body
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "创建记录失败" },
      { status: 500 }
    );
  }
}
```

修改后：

```typescript
import { validateBody } from "@/lib/validations/validate";
import { createRecordSchema } from "@/lib/validations/records";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    // 验证输入
    const body = await validateBody(request, createRecordSchema);
    if (body instanceof NextResponse) return body;

    const db = getSupabaseClient(auth.token);
    const { data, error } = await db.from("records").insert({
      user_id: auth.user.id,
      time_dimension: body.timeDimension,
      record_date: body.recordDate,
      learning: body.learning || {},
      work: body.work || {},
      life: body.life || {},
      health: body.health || {},
      mood: body.mood || {},
      mood_score: body.moodScore,
      summary: body.summary,
      goal_id: body.goalId,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "创建记录失败" },
      { status: 500 }
    );
  }
}
```

### 步骤 5：修改所有 API Routes

需要修改的 API Route 列表：

| 文件 | 方法 | 使用的 Schema |
|------|------|---------------|
| `src/app/api/records/route.ts` | POST | `createRecordSchema` |
| `src/app/api/records/[id]/route.ts` | PUT | `updateRecordSchema` |
| `src/app/api/goals/route.ts` | POST | `createGoalSchema` |
| `src/app/api/goals/[id]/route.ts` | PUT | `updateGoalSchema` |
| `src/app/api/supervise/route.ts` | POST | `createSupervisionSchema` |
| `src/app/api/supervise/rules/route.ts` | POST | `createReminderRuleSchema` |
| `src/app/api/supervise/rules/[id]/route.ts` | PUT | `updateReminderRuleSchema` |

## 验收标准

- [ ] `src/lib/validations/` 目录已创建，包含 `records.ts`、`goals.ts`、`supervise.ts`、`index.ts`、`validate.ts`
- [ ] 所有 Schema 文件覆盖了对应 API Route 接收的所有字段
- [ ] 验证工具函数 `validateBody` 验证失败时返回 400 状态码和详细错误信息
- [ ] 7 个 API Route 文件均已集成 `validateBody` 调用
- [ ] 验证通过后，`body` 具有正确的 TypeScript 类型推断
- [ ] 运行 `pnpm ts-check` 无类型错误
- [ ] 运行 `pnpm lint` 无 lint 错误

## 预估工时

1 人天