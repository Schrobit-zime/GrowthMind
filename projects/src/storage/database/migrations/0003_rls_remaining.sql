-- ============================================================
-- GrowthMind RLS 策略补充迁移 0003
-- 日期：2026-06-22
-- 描述：为 analysis_history、gateway_usage_log、email_templates、health_check 表配置 RLS
-- 执行方式：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. analysis_history 表 RLS
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis history" ON analysis_history;
DROP POLICY IF EXISTS "Users can insert own analysis history" ON analysis_history;

CREATE POLICY "Users can view own analysis history" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis history" ON analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. gateway_usage_log 表 RLS
ALTER TABLE gateway_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gateway logs" ON gateway_usage_log;
DROP POLICY IF EXISTS "Admins can manage all gateway logs" ON gateway_usage_log;

CREATE POLICY "Users can view own gateway logs" ON gateway_usage_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all gateway logs" ON gateway_usage_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 3. email_templates 表 RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;

CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. health_check 表 RLS
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage health check" ON health_check;

CREATE POLICY "Service role can manage health check" ON health_check
  FOR ALL USING (auth.role() = 'service_role');