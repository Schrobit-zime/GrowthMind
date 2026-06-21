# 数据库 RLS 策略配置

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- **技术栈**：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **后端**：Supabase (Auth + PostgreSQL) + Drizzle ORM
- **包管理**：pnpm（严禁 npm/yarn）
- **项目路径**：`/Users/jahangir/workspace/GrowthMind/projects/`
- **数据库 Schema**：`src/storage/database/shared/schema.ts`
- **中间件**：`src/middleware.ts`（已实现角色守卫和 API 鉴权）

### 数据库表结构（共 9 张表）

| 表名 | 用户标识字段 | 是否需要 RLS |
|------|-------------|-------------|
| `profiles` | `user_id` | ✅ 需要 |
| `records` | `user_id` | ✅ 需要 |
| `goals` | `user_id` | ✅ 需要 |
| `supervision_relations` | `admin_user_id`, `supervised_user_id` | ✅ 需要（双方可见） |
| `reminder_rules` | `admin_user_id`, `supervised_user_id` | ✅ 需要（双方可见） |
| `analysis_history` | `user_id` | ❌ 暂不需要 |
| `gateway_usage_log` | `user_id` | ❌ 暂不需要 |
| `email_templates` | 无 | ❌ 管理系统表 |
| `health_check` | 无 | ❌ 系统表 |

## 任务目标

为 Supabase 数据库中的 5 张核心业务表配置 Row Level Security 策略，确保用户只能访问自己的数据，Admin 角色可访问所有数据。

## 实施步骤

### 步骤 1：读取数据库 Schema 确认字段名

先读取 `src/storage/database/shared/schema.ts`，确认每张表的字段名和类型。

### 步骤 2：生成 SQL 迁移文件

创建文件 `src/storage/database/migrations/0001_rls_policies.sql`，内容包含：

1. **启用 RLS** — 为 5 张表启用 RLS
2. **删除旧策略**（幂等）— 使用 `DROP POLICY IF EXISTS`
3. **创建用户级 SELECT 策略** — 用户只能读取自己的数据
4. **创建用户级 INSERT 策略** — 用户只能插入自己的数据
5. **创建用户级 UPDATE 策略** — 用户只能更新自己的数据
6. **创建用户级 DELETE 策略** — 用户只能删除自己的数据
7. **创建 Admin 全局策略** — Admin 角色可操作所有数据

### 步骤 3：在 Supabase Dashboard SQL Editor 中执行

将生成的 SQL 内容复制到 Supabase Dashboard → SQL Editor 中执行。

### 步骤 4：验证

使用 Supabase Dashboard → Table Editor 验证每张表的 RLS 状态。

## 代码示例

```sql
-- ============================================================
-- GrowthMind RLS 策略迁移 0001
-- 日期：2026-06-21
-- 描述：为 5 张核心表配置 Row Level Security
-- 执行方式：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. 启用 RLS（所有表）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（幂等，确保可重复执行）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own records" ON records;
DROP POLICY IF EXISTS "Users can insert own records" ON records;
DROP POLICY IF EXISTS "Users can update own records" ON records;
DROP POLICY IF EXISTS "Users can delete own records" ON records;
DROP POLICY IF EXISTS "Admins can manage all records" ON records;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Admins can manage all goals" ON goals;

DROP POLICY IF EXISTS "Users can view own supervision relations" ON supervision_relations;
DROP POLICY IF EXISTS "Users can insert own supervision relations" ON supervision_relations;
DROP POLICY IF EXISTS "Users can update own supervision relations" ON supervision_relations;
DROP POLICY IF EXISTS "Admins can manage all supervision relations" ON supervision_relations;

DROP POLICY IF EXISTS "Users can view own reminder rules" ON reminder_rules;
DROP POLICY IF EXISTS "Users can insert own reminder rules" ON reminder_rules;
DROP POLICY IF EXISTS "Users can update own reminder rules" ON reminder_rules;
DROP POLICY IF EXISTS "Users can delete own reminder rules" ON reminder_rules;
DROP POLICY IF EXISTS "Admins can manage all reminder rules" ON reminder_rules;

-- 3. profiles 表策略
-- 用户只能查看和更新自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. records 表策略
CREATE POLICY "Users can view own records" ON records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON records
  FOR DELETE USING (auth.uid() = user_id);

-- 5. goals 表策略
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- 6. supervision_relations 表策略
-- 注意：admin_user_id 和 supervised_user_id 双方都需要能查看，但只有 admin 能创建/修改/删除
CREATE POLICY "Users can view own supervision relations" ON supervision_relations
  FOR SELECT USING (
    auth.uid() = admin_user_id OR auth.uid() = supervised_user_id
  );

CREATE POLICY "Users can insert own supervision relations" ON supervision_relations
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update own supervision relations" ON supervision_relations
  FOR UPDATE USING (auth.uid() = admin_user_id);

-- 7. reminder_rules 表策略
-- 与 supervision_relations 类似，双方可查看，admin 可增删改
CREATE POLICY "Users can view own reminder rules" ON reminder_rules
  FOR SELECT USING (
    auth.uid() = admin_user_id OR auth.uid() = supervised_user_id
  );

CREATE POLICY "Users can insert own reminder rules" ON reminder_rules
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update own reminder rules" ON reminder_rules
  FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can delete own reminder rules" ON reminder_rules
  FOR DELETE USING (auth.uid() = admin_user_id);

-- 8. Admin 全局策略（管理员可访问所有数据）
-- 通过检查 profiles 表中的 role 字段来实现
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all records" ON records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all goals" ON goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all supervision relations" ON supervision_relations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all reminder rules" ON reminder_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

## 验收标准

- [ ] 迁移文件 `src/storage/database/migrations/0001_rls_policies.sql` 已创建，内容完整
- [ ] 5 张表（profiles、records、goals、supervision_relations、reminder_rules）均已启用 RLS
- [ ] 普通用户只能对自己的数据进行 CRUD 操作
- [ ] supervision_relations 和 reminder_rules 的 admin_user_id 和 supervised_user_id 双方都能查看
- [ ] Admin 角色用户可以访问所有数据
- [ ] SQL 文件可重复执行（幂等，使用 DROP POLICY IF EXISTS）
- [ ] 在 Supabase Dashboard SQL Editor 中执行无报错

## 预估工时

0.5 人天