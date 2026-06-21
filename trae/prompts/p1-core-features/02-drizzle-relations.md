# P1-02：Drizzle Relations 完善

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

- Drizzle Schema：`src/storage/database/shared/schema.ts`（9 张表定义）
- Drizzle Relations：`src/storage/database/shared/relations.ts`（当前状态需读取确认）

## 任务目标

完善 Drizzle ORM 的表关联定义，确保所有表之间的关系正确定义，支持关联查询（`db.query.*.findMany({ with: {...} })`）。

## 实施步骤

### 步骤 1：读取当前 Schema 和 Relations

首先读取以下文件了解当前状态：
- `src/storage/database/shared/schema.ts` — 确认所有 9 张表的定义和字段名
- `src/storage/database/shared/relations.ts` — 确认当前关联定义的状态

### 步骤 2：定义所有表关联

在 `src/storage/database/shared/relations.ts` 中定义以下关联：

#### 2.1 profiles 表关联（一对多）

```typescript
export const profilesRelations = relations(profiles, ({ many }) => ({
  records: many(records),
  goals: many(goals),
  // 作为监督者（admin）的监督关系
  supervisedRelations: many(supervisionRelations, {
    relationName: "supervisor",
  }),
  // 作为被监督者（supervised）的监督关系
  beingSupervised: many(supervisionRelations, {
    relationName: "supervised",
  }),
  reminderRules: many(reminderRules),
  analysisHistory: many(analysisHistory),
  gatewayUsageLogs: many(gatewayUsageLog),
}));
```

#### 2.2 records 表关联（多对一）

```typescript
export const recordsRelations = relations(records, ({ one }) => ({
  user: one(profiles, {
    fields: [records.userId],
    references: [profiles.userId],
  }),
  goal: one(goals, {
    fields: [records.goalId],
    references: [goals.id],
  }),
}));
```

#### 2.3 goals 表关联（多对一 + 一对多）

```typescript
export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(profiles, {
    fields: [goals.userId],
    references: [profiles.userId],
  }),
  records: many(records),
}));
```

#### 2.4 supervisionRelations 表关联（多对一，两种关系）

```typescript
export const supervisionRelationsRelations = relations(
  supervisionRelations,
  ({ one }) => ({
    supervisor: one(profiles, {
      fields: [supervisionRelations.adminUserId],
      references: [profiles.userId],
      relationName: "supervisor",
    }),
    supervised: one(profiles, {
      fields: [supervisionRelations.supervisedUserId],
      references: [profiles.userId],
      relationName: "supervised",
    }),
  })
);
```

#### 2.5 reminderRules 表关联（多对一）

```typescript
export const reminderRulesRelations = relations(reminderRules, ({ one }) => ({
  admin: one(profiles, {
    fields: [reminderRules.adminUserId],
    references: [profiles.userId],
  }),
  supervisedUser: one(profiles, {
    fields: [reminderRules.supervisedUserId],
    references: [profiles.userId],
  }),
}));
```

#### 2.6 analysisHistory 表关联（多对一）

```typescript
export const analysisHistoryRelations = relations(
  analysisHistory,
  ({ one }) => ({
    user: one(profiles, {
      fields: [analysisHistory.userId],
      references: [profiles.userId],
    }),
  })
);
```

#### 2.7 gatewayUsageLog 表关联（多对一）

```typescript
export const gatewayUsageLogRelations = relations(
  gatewayUsageLog,
  ({ one }) => ({
    user: one(profiles, {
      fields: [gatewayUsageLog.userId],
      references: [profiles.userId],
    }),
  })
);
```

### 步骤 3：验证关联定义

在 TypeScript 编译层面验证关联定义是否正确：

```bash
cd /Users/jahangir/workspace/GrowthMind/projects && pnpm typecheck
```

### 步骤 4：更新 API Routes 使用关联查询

完成 Relations 定义后，更新以下 API Route 使用关联查询替代手动 JOIN：

**`src/app/api/supervise/route.ts` GET 方法**：
```typescript
// 使用关联查询一次性获取监督关系 + 被监督用户信息
const data = await db.query.supervisionRelations.findMany({
  where: and(
    eq(supervisionRelations.adminUserId, auth.user.id),
    eq(supervisionRelations.active, true)
  ),
  with: {
    supervised: true, // 自动关联 profiles 表
  },
  orderBy: desc(supervisionRelations.createdAt),
});
```

## 代码示例

### 完整的 relations.ts 文件结构

```typescript
import { relations } from "drizzle-orm/relations";
import {
  profiles,
  records,
  goals,
  supervisionRelations,
  reminderRules,
  analysisHistory,
  gatewayUsageLog,
} from "./schema";

// ─── profiles 关联 ───
export const profilesRelations = relations(profiles, ({ many }) => ({
  records: many(records),
  goals: many(goals),
  supervisedRelations: many(supervisionRelations, {
    relationName: "supervisor",
  }),
  beingSupervised: many(supervisionRelations, {
    relationName: "supervised",
  }),
  reminderRules: many(reminderRules),
  analysisHistory: many(analysisHistory),
  gatewayUsageLogs: many(gatewayUsageLog),
}));

// ─── records 关联 ───
export const recordsRelations = relations(records, ({ one }) => ({
  user: one(profiles, {
    fields: [records.userId],
    references: [profiles.userId],
  }),
  goal: one(goals, {
    fields: [records.goalId],
    references: [goals.id],
  }),
}));

// ─── goals 关联 ───
export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(profiles, {
    fields: [goals.userId],
    references: [profiles.userId],
  }),
  records: many(records),
}));

// ─── supervisionRelations 关联 ───
export const supervisionRelationsRelations = relations(
  supervisionRelations,
  ({ one }) => ({
    supervisor: one(profiles, {
      fields: [supervisionRelations.adminUserId],
      references: [profiles.userId],
      relationName: "supervisor",
    }),
    supervised: one(profiles, {
      fields: [supervisionRelations.supervisedUserId],
      references: [profiles.userId],
      relationName: "supervised",
    }),
  })
);

// ─── reminderRules 关联 ───
export const reminderRulesRelations = relations(reminderRules, ({ one }) => ({
  admin: one(profiles, {
    fields: [reminderRules.adminUserId],
    references: [profiles.userId],
  }),
  supervisedUser: one(profiles, {
    fields: [reminderRules.supervisedUserId],
    references: [profiles.userId],
  }),
}));

// ─── analysisHistory 关联 ───
export const analysisHistoryRelations = relations(
  analysisHistory,
  ({ one }) => ({
    user: one(profiles, {
      fields: [analysisHistory.userId],
      references: [profiles.userId],
    }),
  })
);

// ─── gatewayUsageLog 关联 ───
export const gatewayUsageLogRelations = relations(
  gatewayUsageLog,
  ({ one }) => ({
    user: one(profiles, {
      fields: [gatewayUsageLog.userId],
      references: [profiles.userId],
    }),
  })
);
```

### 关联查询使用示例

```typescript
// 查询用户及其所有记录
const userWithRecords = await db.query.profiles.findFirst({
  where: eq(profiles.userId, userId),
  with: {
    records: true,
    goals: true,
  },
});

// 查询监督关系及其被监督者信息
const supervisionWithUser = await db.query.supervisionRelations.findMany({
  where: eq(supervisionRelations.adminUserId, adminId),
  with: {
    supervised: true,
  },
});
```

## 验收标准

- [ ] `relations.ts` 中所有 7 组关联定义完整且正确
- [ ] `supervisionRelations` 的双向关联（supervisor + supervised）使用 `relationName` 正确区分
- [ ] `pnpm typecheck` 无类型错误
- [ ] 使用 `db.query.*.findMany({ with: {...} })` 进行关联查询无运行时错误
- [ ] `src/app/api/supervise/route.ts` 的 GET 方法已使用关联查询替代逐条查询

## 预估工时

1 人天

## 依赖

依赖 P1-01（Drizzle 迁移完成后才能确认 Schema 最终状态）