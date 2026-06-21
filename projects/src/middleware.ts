import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/rate-limit";

const adminRoutes = ["/supervise", "/gateway"];

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((r) => pathname.startsWith(r));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API config
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|ico|png|jpg|jpeg|gif|webp)$/) ||
    pathname === "/api/supabase-config"
  ) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Get Supabase session from cookies
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Check for session cookie or Authorization header
  const accessToken = request.cookies.get("sb-access-token")?.value
    || request.cookies.get("sb-growthmind-auth-token")?.value
    || request.headers.get("authorization")?.replace("Bearer ", "");

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/api/supabase-config"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (!accessToken && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin route protection
  if (isAdminRoute(pathname) && accessToken) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);

      if (user) {
        const origin = request.nextUrl.origin;
        const profileRes = await fetch(
          `${origin}/api/profile?userId=${encodeURIComponent(user.id)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const profile = profileRes.ok ? await profileRes.json() : null;

        if (profile?.role !== "admin") {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { success: false, error: "权限不足" },
              { status: 403 }
            );
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    } catch {
      // If verification fails, redirect non-API requests
      if (!pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
