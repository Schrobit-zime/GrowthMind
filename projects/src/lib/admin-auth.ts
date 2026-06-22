import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";

export async function isAdminUser(userId: string): Promise<boolean> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile?.role === "admin";
}
