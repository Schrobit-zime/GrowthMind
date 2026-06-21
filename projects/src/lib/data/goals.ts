import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/storage/database/shared/schema";
import type { User } from "@supabase/supabase-js";

async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("sb-growthmind-auth-token")?.value;
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

export async function getGoalById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .limit(1);

  return result[0] || null;
}
