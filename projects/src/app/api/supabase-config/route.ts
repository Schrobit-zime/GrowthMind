import { NextResponse } from "next/server";
import { getSupabaseCredentials } from "@/storage/database/supabase-client";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    if (!url || !anonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase 凭证未配置" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { url, anonKey } });
  } catch (error) {
    return handleApiError(error, "获取 Supabase 配置");
  }
}
