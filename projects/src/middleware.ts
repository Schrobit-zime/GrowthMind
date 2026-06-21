import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/rate-limit";
import { getTokenFromRequest } from "@/lib/auth";
import type { RateLimitConfig } from "@/lib/rate-limit";

const adminRoutes = ["/supervise", "/gateway"];

/**
 * 判断是否为管理员路由
 */
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((r) => pathname.startsWith(r));
}

/**
 * 登录/认证接口限流配置：每分钟最多 5 次
 */
const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  max: 5,
};

/**
 * 通用 API 限流配置：每分钟最多 60 次
 */
const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  max: 60,
};

/**
 * 敏感 API 限流配置：每分钟最多 10 次
 */
const SENSITIVE_API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  max: 10,
};

/**
 * 重定向到登录页
 */
function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * 创建 Supabase 客户端（用于验证 token 和查询角色）
 */
function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string, accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源和 API 配置
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|ico|png|jpg|jpeg|gif|webp|json)$/) ||
    pathname === "/api/supabase-config"
  ) {
    return NextResponse.next();
  }

  // 登录和认证接口限流（每分钟 5 次）
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    const allowed = await applyRateLimit(request, LOGIN_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后重试" },
        { status: 429 },
      );
    }
  }

  // 敏感 API 限流（每分钟 10 次）
  if (pathname.startsWith("/api/analysis") || pathname.startsWith("/api/gateway")) {
    const allowed = await applyRateLimit(request, SENSITIVE_API_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后重试" },
        { status: 429 },
      );
    }
  }

  // 通用 API 限流（每分钟 60 次）
  if (pathname.startsWith("/api/")) {
    const allowed = await applyRateLimit(request, API_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后重试" },
        { status: 429 },
      );
    }
  }

  // 获取 Supabase 配置
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // 从 cookie 或 Authorization 头获取 access token
  // 优先读取 httpOnly 的 sb-access-token，fallback 到 Authorization header
  const accessToken =
    getTokenFromRequest(request) || request.cookies.get("sb-growthmind-auth-token")?.value;

  // 公开路由不需要鉴权
  const publicRoutes = ["/login", "/api/supabase-config"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  // 无 token 且非公开路由：拒绝访问
  if (!accessToken && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  // 对所有受保护路由验证 token 有效性（不只是检查 cookie 存在）
  // 先通过 sb-logged-in 标记 cookie 做快速判断，避免不必要的 Supabase 调用
  if (accessToken && !isPublic) {
    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, accessToken);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "token 无效或已过期" },
            { status: 401 },
          );
        }
        return redirectToLogin(request);
      }
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ success: false, error: "认证服务异常" }, { status: 401 });
      }
      return redirectToLogin(request);
    }
  }

  // 管理员路由保护：使用 Supabase 客户端直接查询角色（不再通过 fetch 调用无鉴权的 /api/profile）
  if (isAdminRoute(pathname) && accessToken) {
    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, accessToken);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        return redirectToLogin(request);
      }
      // 直接从数据库查询角色（使用 Supabase REST API）
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // catch 块对 API 请求返回 401/403
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
      }
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
