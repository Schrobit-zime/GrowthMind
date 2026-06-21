# P1-01：Drizzle ORM 迁移

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

- Drizzle Schema：`src/storage/database/shared/schema.ts`（9 张表，字段名使用 camelCase，Drizzle 自动映射到 snake_case）
- 当前 Supabase 客户端：`src/storage/database/supabase-client.ts`
- 浏览器端 Supabase 客户端：`src/lib/supabase-browser.ts`
- 认证中间件：`src/lib/api-auth.ts`（`authenticateRequest` + `unauthorizedResponse`）
- 当前 API Routes（使用 Supabase SDK）：
  - `src/app/api/records/route.ts` — GET（列表）+ POST（创建）
  - `src/app/api/records/[id]/route.ts` — GET（详情）+ PUT（更新）+ DELETE（删除）
  - `src/app/api/goals/route.ts` — GET（列表）+ POST（创建）
  - `src/app/api/goals/[id]/route.ts` — GET（详情）+ PUT（更新）+ DELETE（删除）
  - `src/app/api/supervise/route.ts` — GET（列表）+ POST（创建）
  - `src/app/api/supervise/[id]/route.ts` — DELETE（解除监督）
  - `src/app/api/supervise/rules/route.ts` — GET（列表）+ POST（创建）
  - `src/app/api/supervise/rules/[id]/route.ts` — PUT（更新）+ DELETE（删除）

## 任务目标

将所有 API Routes 从 Supabase JS SDK 直接调用迁移到 Drizzle ORM，获得类型安全的数据库操作能力。

## 实施步骤

### 步骤 1：创建 Drizzle 数据库连接

**目标文件**：`src/lib/db.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/storage/database/shared/schema";

// 获取数据库连接 URL（从环境变量中读取）
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// 创建 postgres 连接
const client = postgres(connectionString, { max: 10 });

// 创建 Drizzle 实例
export const db = drizzle(client, { schema });

// 导出 schema 以便其他地方使用
export { schema };
```

**注意**：
- 数据库连接 URL 可能存储在 `COZE_SUPABASE_URL` 相关环境变量中，需要先检查现有环境变量配置
- 如果无法直接获取 PostgreSQL 直连 URL，可以考虑使用 `drizzle-orm/pg-core` 结合 Supabase 的 `pg` 连接
- 若项目使用 Supabase 连接池，需要使用 `DATABASE_URL`（PostgreSQL 直连字符串）而非 Supabase URL

### 步骤 2：重构 API Routes

需要逐一重构以下 8 个 API Route 文件。每个文件的重构遵循以下模式：

**重构前（Supabase SDK）**：
```typescript
import { getSupabaseClient } from "@/storage/database/supabase-client";

const db = getSupabaseClient(auth.token);
const { data, error } = await db.from("records").select("*").eq("user_id", auth.user.id);
```

**重构后（Drizzle ORM）**：
```typescript
import { db, schema } from "@/lib/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

const { records } = schema;
const data = await db.select().from(records).where(eq(records.userId, auth.user.id)).orderBy(desc(records.createdAt));
```

### 步骤 3：各 API Route 迁移对照表

#### 3.1 `src/app/api/records/route.ts`

**GET 方法**：
- 当前：`db.from("records").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false })`
- 迁移：`db.select().from(records).where(eq(records.userId, auth.user.id)).orderBy(desc(records.createdAt))`
- 查询参数：`dimension` → `timeDimension` 过滤；`from`/`to` → `recordDate` 范围过滤；`limit` → `.limit(N)`
- 注意：Drizzle 中字段名为 camelCase（`userId`, `timeDimension`, `recordDate`, `createdAt`）

**POST 方法**：
- 当前：`db.from("records").insert({...}).select().single()`
- 迁移：`db.insert(records).values({...}).returning()`
- 注意：Drizzle 中 `insert` 返回数组，需要取 `[0]`；字段映射：
  - `user_id` → `userId`
  - `time_dimension` → `timeDimension`
  - `record_date` → `recordDate`
  - `mood_score` → `moodScore`
  - `goal_id` → `goalId`

#### 3.2 `src/app/api/records/[id]/route.ts`

**GET 方法**：单条查询
- 迁移：`db.select().from(records).where(and(eq(records.id, id), eq(records.userId, auth.user.id))).limit(1)`

**PUT 方法**：更新记录
- 迁移：`db.update(records).set({...}).where(and(eq(records.id, id), eq(records.userId, auth.user.id))).returning()`

**DELETE 方法**：删除记录
- 迁移：`db.delete(records).where(and(eq(records.id, id), eq(records.userId, auth.user.id)))`

#### 3.3 `src/app/api/goals/route.ts`

**GET 方法**：目标列表
- 迁移：`db.select().from(goals).where(eq(goals.userId, auth.user.id)).orderBy(desc(goals.createdAt))`

**POST 方法**：创建目标
- 字段映射：
  - `user_id` → `userId`
  - `target_value` → `targetValue`
  - `current_value` → `currentValue`

#### 3.4 `src/app/api/goals/[id]/route.ts`

**GET/PUT/DELETE**：与 records/[id] 模式相同，替换表名为 `goals`

#### 3.5 `src/app/api/supervise/route.ts`

**GET 方法**：监督关系列表
- 当前实现较复杂：先查 supervision_relations，再逐个查 profiles 进行数据富化
- 迁移后使用 Drizzle 的关联查询（需配合 P1-02 完成后的 relations）：
  ```typescript
  const data = await db.query.supervisionRelations.findMany({
    where: and(
      eq(supervisionRelations.adminUserId, auth.user.id),
      eq(supervisionRelations.active, true)
    ),
    with: {
      supervised: true, // 关联 profiles 表
    },
    orderBy: desc(supervisionRelations.createdAt),
  });
  ```
- 注意：`db.query` 需要在 relations.ts 定义后才能使用，若 P1-02 未完成则先保留当前逐条查询模式

**POST 方法**：添加监督关系
- 字段映射：`admin_user_id` → `adminUserId`；`supervised_user_id` → `supervisedUserId`

#### 3.6 `src/app/api/supervise/[id]/route.ts`

**DELETE 方法**：软删除（设置 active = false）
- 迁移：`db.update(supervisionRelations).set({ active: false }).where(and(eq(supervisionRelations.id, id), eq(supervisionRelations.adminUserId, auth.user.id)))`

#### 3.7 `src/app/api/supervise/rules/route.ts`

**GET 方法**：规则列表
- 支持 `supervisedUserId` 查询参数过滤
- 迁移：`db.select().from(reminderRules).where(...)` 模式

**POST 方法**：创建规则
- 字段映射：`admin_user_id` → `adminUserId`；`supervised_user_id` → `supervisedUserId`；`rule_type` → `ruleType`

#### 3.8 `src/app/api/supervise/rules/[id]/route.ts`

**PUT/DELETE**：与 goals/[id] 模式相同

### 步骤 4：保持 API 响应格式不变

所有 API 响应格式保持不变：
```typescript
{ success: true, data: T }           // 成功
{ success: false, error: string }     // 失败
```

鉴权逻辑保持不变（`authenticateRequest` + `unauthorizedResponse`）。

### 步骤 5：清理

- 迁移完成后，确认所有 API Routes 不再导入 `getSupabaseClient`
- 检查 `src/storage/database/supabase-client.ts` 是否仅被 API Routes 使用（如果是，可以保留供浏览器端使用）
- 浏览器端 Supabase 客户端（`src/lib/supabase-browser.ts`）保持不变（用于 Auth）

## 代码示例

### 创建 `src/lib/db.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/storage/database/shared/schema";

// 获取 PostgreSQL 直连 URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// 创建 postgres 客户端（连接池）
const client = postgres(connectionString, {
  max: 10,           // 最大连接数
  idle_timeout: 30,  // 空闲超时（秒）
  connect_timeout: 10, // 连接超时（秒）
});

// 创建 Drizzle 数据库实例，绑定 schema
export const db = drizzle(client, { schema });

// 重新导出 schema，方便其他地方通过 db 路径引用
export { schema };
```

### 重构后的 records GET 路由示例

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";

const { records } = schema;

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);

    const conditions = [eq(records.userId, auth.user.id)];

    const dimension = searchParams.get("dimension");
    if (dimension) {
      conditions.push(eq(records.timeDimension, dimension));
    }

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      conditions.push(gte(records.recordDate, from));
      conditions.push(lte(records.recordDate, to));
    }

    const limit = parseInt(searchParams.get("limit") || "50");

    const data = await db
      .select()
      .from(records)
      .where(and(...conditions))
      .orderBy(desc(records.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取记录失败:", error);
    return NextResponse.json(
      { success: false, error: "获取记录失败" },
      { status: 500 }
    );
  }
}
```

## 验收标准

- [ ] `src/lib/db.ts` 文件已创建，Drizzle 数据库连接正常工作
- [ ] 所有 8 个 API Route 文件已从 Supabase SDK 迁移到 Drizzle ORM
- [ ] API 响应格式保持不变（`{ success, data/error }`）
- [ ] 鉴权逻辑保持不变（`authenticateRequest`）
- [ ] 所有字段名已从 snake_case 映射到 camelCase
- [ ] 所有 API Route 文件不再导入 `getSupabaseClient`
- [ ] 可通过 `pnpm dev` 启动项目并正常调用各 API 端点

## 预估工时

3 人天

## 依赖

无