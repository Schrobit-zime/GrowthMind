-- ============================================================
-- GrowthMind 外键约束迁移 0004
-- 日期：2026-06-22
-- 描述：为核心表添加外键约束，确保数据引用完整性
-- 执行方式：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. records 表外键
ALTER TABLE records
  ADD CONSTRAINT IF NOT EXISTS fk_records_user_id FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE records
  ADD CONSTRAINT IF NOT EXISTS fk_records_goal_id FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

-- 2. goals 表外键
ALTER TABLE goals
  ADD CONSTRAINT IF NOT EXISTS fk_goals_user_id FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 3. supervision_relations 表外键
ALTER TABLE supervision_relations
  ADD CONSTRAINT IF NOT EXISTS fk_supervision_admin FOREIGN KEY (admin_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE supervision_relations
  ADD CONSTRAINT IF NOT EXISTS fk_supervision_supervised FOREIGN KEY (supervised_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 4. reminder_rules 表外键
ALTER TABLE reminder_rules
  ADD CONSTRAINT IF NOT EXISTS fk_reminder_rules_admin FOREIGN KEY (admin_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE reminder_rules
  ADD CONSTRAINT IF NOT EXISTS fk_reminder_rules_supervised FOREIGN KEY (supervised_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 5. analysis_history 表外键
ALTER TABLE analysis_history
  ADD CONSTRAINT IF NOT EXISTS fk_analysis_history_user_id FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 6. gateway_usage_log 表外键
ALTER TABLE gateway_usage_log
  ADD CONSTRAINT IF NOT EXISTS fk_gateway_usage_log_user_id FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;