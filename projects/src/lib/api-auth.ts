import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getTokenFromRequest } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export interface AuthResult {
  user: User;
  token: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  try {
    const db = getSupabaseClient(token);
    const {
      data: { user },
      error,
    } = await db.auth.getUser(token);
    if (error || !user) return null;
    return { user, token };
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return Response.json({ success: false, error: "未授权，请先登录" }, { status: 401 });
}
