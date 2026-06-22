import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import {
  getSupabaseCredentials,
  getSupabaseServiceRoleKey,
} from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { url } = getSupabaseCredentials();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "SERVICE_ROLE_KEY 未配置" },
        { status: 500 },
      );
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "缺少 email 或 password" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // 用户已存在，尝试更新
      if (
        createError.message.includes("already been registered") ||
        createError.message.includes("duplicate key")
      ) {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return NextResponse.json({ success: false, error: listError.message }, { status: 400 });
        }
        const existingUser = users.users.find((u) => u.email === email);
        if (!existingUser) {
          return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
        }
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password, email_confirm: true },
        );
        if (updateError) {
          return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
        }

        const userId = existingUser.id;
        const [existing] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);
        if (existing) {
          await db.update(profiles).set({ role: "admin" }).where(eq(profiles.userId, userId));
        } else {
          await db
            .insert(profiles)
            .values({ userId, displayName: email.split("@")[0], role: "admin" });
        }

        return NextResponse.json({
          success: true,
          message: `管理员账号已更新: ${email}`,
          userId: userId.slice(0, 8),
        });
      }
      return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
    }

    const userId = authUser.user.id;

    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    if (existing) {
      await db
        .update(profiles)
        .set({ role: "admin", displayName: email.split("@")[0] })
        .where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        displayName: email.split("@")[0],
        role: "admin",
      });
    }

    return NextResponse.json({
      success: true,
      message: `管理员账号已创建: ${email}`,
      userId: userId.slice(0, 8),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
