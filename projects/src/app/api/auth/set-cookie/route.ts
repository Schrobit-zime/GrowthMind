import { NextRequest, NextResponse } from "next/server";

// 服务端设置 httpOnly cookie，同时设置非 httpOnly 标记 cookie
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: "缺少 token" }, { status: 400 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set("sb-access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    // 同时设置标记 cookie 供 middleware 快速判断登录状态
    response.cookies.set("sb-logged-in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "设置失败" }, { status: 500 });
  }
}

// 清除 cookie（登出时调用）
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set("sb-access-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("sb-logged-in", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "清除失败" }, { status: 500 });
  }
}