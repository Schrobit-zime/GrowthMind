-- ============================================================
-- GrowthMind 索引优化迁移 0002
-- 日期：2026-06-22
-- 描述：为核心表添加性能索引，优化查询效率
-- 执行方式：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. records 表索引
CREATE INDEX IF NOT EXISTS idx_records_user_id_record_date ON records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_records_user_id_created_at ON records(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_records_goal_id ON records(goal_id);

-- 2. goals 表索引
CREATE INDEX IF NOT EXISTS idx_goals_user_id_status ON goals(user_id, status);

-- 3. supervision_relations 表索引
CREATE INDEX IF NOT EXISTS idx_supervision_relations_admin_user_id_active ON supervision_relations(admin_user_id, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supervision_relations_unique ON supervision_relations(admin_user_id, supervised_user_id, active);

-- 4. reminder_rules 表索引
CREATE INDEX IF NOT EXISTS idx_reminder_rules_enabled_supervised_user_id ON reminder_rules(enabled, supervised_user_id);

-- 5. analysis_history 表索引
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id_created_at ON analysis_history(user_id, created_at);

-- 6. gateway_usage_log 表索引
CREATE INDEX IF NOT EXISTS idx_gateway_usage_log_user_id_created_at ON gateway_usage_log(user_id, created_at);