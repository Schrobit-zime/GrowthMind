import { createClient } from "@supabase/supabase-js";
import { getTokenFromCookies } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

/**
 * 从 Cookie 中获取当前登录用户
 * 通过 Supabase 验证 access token 并返回 User 对象
 */
export async function getCurrentUser(): Promise<User | null> {
  const accessToken = await getTokenFromCookies();
  if (!accessToken) return null;

  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}
