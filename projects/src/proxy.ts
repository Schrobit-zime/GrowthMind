import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/rate-limit";
import { getTokenFromRequest } from "@/lib/auth";
import type { RateLimitConfig } from "@/lib/rate-limit";

const isDev = process.env.NODE_ENV === "development";

const LOGIN_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, max: 5 };
const API_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, max: 60 };
const SENSITIVE_API_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, max: 10 };

function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string, accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源、配置 API 直接放行
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|ico|png|jpg|jpeg|gif|webp)$/) ||
    pathname === "/api/supabase-config"
  ) {
    return NextResponse.next();
  }

  // 页面路由全部放行，认证由客户端 MainLayout 负责
  // 避免服务端 bearer token 校验与客户端 AuthProvider 产生竞态/重定向循环
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // --- 以下仅对 API 路由生效 ---

  // 限流（仅在非开发环境启用，Agent API 由上游控制频率，不限流）
  if (!isDev && !pathname.startsWith("/api/agent/")) {
    if (pathname.startsWith("/api/auth")) {
      const allowed = await applyRateLimit(request, LOGIN_RATE_LIMIT);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: "请求过于频繁，请稍后重试" },
          { status: 429 },
        );
      }
    }

    if (pathname.startsWith("/api/analysis") || pathname.startsWith("/api/gateway")) {
      const allowed = await applyRateLimit(request, SENSITIVE_API_RATE_LIMIT);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: "请求过于频繁，请稍后重试" },
          { status: 429 },
        );
      }
    }

    const allowed = await applyRateLimit(request, API_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后重试" },
        { status: 429 },
      );
    }
  }

  // 跳过无需鉴权的 API
  if (pathname === "/api/supabase-config" || pathname === "/api/auth/set-cookie") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const accessToken = getTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  // 验证 token 有效性
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, accessToken);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return NextResponse.json({ success: false, error: "token 无效或已过期" }, { status: 401 });
    }

    // 仅验证 token；具体权限由 API 路由使用服务端数据库校验
  } catch {
    return NextResponse.json({ success: false, error: "认证服务异常" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
