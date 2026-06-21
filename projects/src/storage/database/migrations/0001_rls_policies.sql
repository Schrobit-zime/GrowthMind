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
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
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
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- 6. supervision_relations 表策略（双方可见）
CREATE POLICY "Users can view own supervision relations" ON supervision_relations
  FOR SELECT USING (
    auth.uid() = admin_user_id OR auth.uid() = supervised_user_id
  );

CREATE POLICY "Users can insert own supervision relations" ON supervision_relations
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update own supervision relations" ON supervision_relations
  FOR UPDATE USING (auth.uid() = admin_user_id);

-- 7. reminder_rules 表策略（双方可见）
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

-- 8. Admin 全局策略（Admin 角色可操作所有数据）
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
