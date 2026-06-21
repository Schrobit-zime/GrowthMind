import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { records } from "@/storage/database/shared/schema";
import { getCurrentUser } from "@/lib/auth-server";

export async function getRecordById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await db
    .select()
    .from(records)
    .where(and(eq(records.id, id), eq(records.userId, user.id)))
    .limit(1);

  return result[0] || null;
}

export async function getRecordsByGoalId(goalId: string, limit = 30) {
  const user = await getCurrentUser();
  if (!user) return [];

  const result = await db
    .select()
    .from(records)
    .where(and(eq(records.goalId, goalId), eq(records.userId, user.id)))
    .limit(limit);

  return result;
}
