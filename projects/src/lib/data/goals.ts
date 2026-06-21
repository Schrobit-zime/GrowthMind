import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/storage/database/shared/schema";
import { getCurrentUser } from "@/lib/auth-server";

export async function getGoalById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .limit(1);

  return result[0] || null;
}
