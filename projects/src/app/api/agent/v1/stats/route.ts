import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { records, goals, analysisHistory } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";

/** GET /api/agent/v1/stats — 返回用户统计概览 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const userId = auth.user.id;

    // 并行查询各项统计数据
    const [recordCount, recentRecords, goalStats, latestAnalysis] = await Promise.all([
      db.select({ total: count() }).from(records).where(eq(records.userId, userId)),

      db
        .select({
          id: records.id,
          timeDimension: records.timeDimension,
          recordDate: records.recordDate,
          moodScore: records.moodScore,
          summary: records.summary,
          createdAt: records.createdAt,
        })
        .from(records)
        .where(eq(records.userId, userId))
        .orderBy(desc(records.createdAt))
        .limit(5),

      db
        .select({
          total: count(),
          active: sql<number>`COUNT(*) FILTER (WHERE ${goals.status} = 'active')`.mapWith(Number),
          completed: sql<number>`COUNT(*) FILTER (WHERE ${goals.status} = 'completed')`.mapWith(
            Number,
          ),
        })
        .from(goals)
        .where(eq(goals.userId, userId)),

      db
        .select({
          id: analysisHistory.id,
          analysisType: analysisHistory.analysisType,
          createdAt: analysisHistory.createdAt,
        })
        .from(analysisHistory)
        .where(eq(analysisHistory.userId, userId))
        .orderBy(desc(analysisHistory.createdAt))
        .limit(1),
    ]);

    const totalRecords = recordCount[0]?.total ?? 0;
    const totalGoals = goalStats[0]?.total ?? 0;
    const activeGoals = goalStats[0]?.active ?? 0;
    const completedGoals = goalStats[0]?.completed ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        records: {
          total: totalRecords,
          recent: recentRecords,
        },
        goals: {
          total: totalGoals,
          active: activeGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        },
        analysis: {
          latestAt: latestAnalysis[0]?.createdAt ?? null,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, "获取统计概览");
  }
}
