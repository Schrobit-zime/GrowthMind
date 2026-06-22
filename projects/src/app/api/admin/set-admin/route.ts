import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const rows = await db.select().from(profiles);
    const target = rows.find(
      (p) => p.displayName === email || p.displayName === email.split("@")[0],
    );
    if (target) {
      await db.update(profiles).set({ role: "admin" }).where(eq(profiles.id, target.id));
      return NextResponse.json({ success: true, message: `${target.displayName} → admin` });
    }
    return NextResponse.json({ success: false, error: "未找到用户" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
