import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// 从请求中提取 token，支持多种来源
export function getTokenFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get("x-session") ||
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("sb-access-token")?.value ||
    null
  );
}

// 从 cookies 中获取 token（服务端）
export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("sb-access-token")?.value || null;
  } catch {
    return null;
  }
}