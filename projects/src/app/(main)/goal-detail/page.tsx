import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { GoalActions } from "@/components/goals/goal-actions";
import { getGoalById } from "@/lib/data/goals";
import { getRecordsByGoalId } from "@/lib/data/records";
import type { Metadata } from "next";

const timeDimensionLabels: Record<string, string> = {
  daily: "日报",
  weekly: "周报",
  monthly: "月报",
  annual: "年报",
  morning: "早报",
  noon: "午报",
  evening: "晚报",
  custom: "自定义",
};

interface Props {
  searchParams: Promise<{ goal_id?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { goal_id } = await searchParams;
  if (!goal_id) return { title: "目标详情 - GrowthMind" };

  const goal = await getGoalById(goal_id);
  if (!goal) return { title: "目标不存在 - GrowthMind" };

  return { title: `${goal.name} - GrowthMind` };
}

export default async function GoalDetailPage({ searchParams }: Props) {
  const { goal_id } = await searchParams;

  if (!goal_id) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/goals"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">目标详情</h1>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">未指定目标 ID</p>
            <Link
              href="/goals"
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              返回目标列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [goal, relatedRecords] = await Promise.all([
    getGoalById(goal_id),
    getRecordsByGoalId(goal_id, 30),
  ]);

  if (!goal) {
    notFound();
  }

  const progress =
    goal.targetValue > 0
      ? Math.min(
          Math.round((goal.currentValue / goal.targetValue) * 100),
          100
        )
      : 0;

  const remainingDays = goal.deadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(goal.deadline).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const trendData = relatedRecords
    .filter((r) => r.recordDate)
    .sort(
      (a, b) =>
        new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
    )
    .slice(-15);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/goals"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">目标详情</h1>
      </div>

      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  transform="rotate(-90 80 80)"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient
                    id="progressGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="rgb(124, 92, 255)" />
                    <stop offset="100%" stopColor="rgb(105, 231, 255)" />
                  </linearGradient>
                </defs>
                <text
                  x="80"
                  y="75"
                  textAnchor="middle"
                  fill="#F7FAFF"
                  fontSize="28"
                  fontWeight="bold"
                >
                  {progress}%
                </text>
                <text
                  x="80"
                  y="95"
                  textAnchor="middle"
                  fill="rgba(154, 167, 199, 0.8)"
                  fontSize="11"
                >
                  完成度
                </text>
              </svg>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {goal.name}
                </h2>
                <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                  {goal.dimension}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">当前进度</p>
                  <p className="text-lg font-bold text-foreground">
                    {goal.currentValue}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{goal.targetValue} {goal.metric}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">截止日期</p>
                  <p className="text-lg font-bold text-foreground">
                    {goal.deadline || "无截止日期"}
                    {remainingDays != null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        · 剩{remainingDays}天
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {trendData.length > 0 && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">
              进度趋势（近{trendData.length}天）
            </h3>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 140" className="w-full h-full">
              <defs>
                <linearGradient id="trendGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(124, 92, 255)"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(124, 92, 255)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="30"
                  y1={20 + i * 35}
                  x2="490"
                  y2={20 + i * 35}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
              ))}
              <path
                d={`M30,${120 - (trendData[0].moodScore || 5) * 10} ${trendData
                  .map(
                    (d, i) =>
                      `L${30 + i * (460 / Math.max(trendData.length - 1, 1))},${120 - (d.moodScore || 5) * 10}`
                  )
                  .join(" ")} L490,140 L30,140 Z`}
                fill="url(#trendGrad2)"
              />
              <path
                d={`M30,${120 - (trendData[0].moodScore || 5) * 10} ${trendData
                  .map(
                    (d, i) =>
                      `L${30 + i * (460 / Math.max(trendData.length - 1, 1))},${120 - (d.moodScore || 5) * 10}`
                  )
                  .join(" ")}`}
                fill="none"
                stroke="rgb(124, 92, 255)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {trendData
                .filter((_, i) => i % 3 === 0)
                .map((d, i) => (
                  <text
                    key={i}
                    x={
                      30 + i * 3 * (460 / Math.max(trendData.length - 1, 1))
                    }
                    y="135"
                    textAnchor="middle"
                    fill="rgba(154,167,199,0.6)"
                    fontSize="9"
                  >
                    {d.recordDate ? d.recordDate.slice(5) : ""}
                  </text>
                ))}
            </svg>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          关联记录
        </h3>
        {relatedRecords.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">暂无关联记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {relatedRecords.map((rec) => (
              <Link
                key={rec.id}
                href={`/record-detail?record_id=${rec.id}`}
                className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                        {timeDimensionLabels[rec.timeDimension] ||
                          rec.timeDimension}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rec.recordDate}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {rec.summary || "无摘要"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {rec.moodScore != null && (
                      <p className="text-sm font-bold text-foreground">
                        心情 {rec.moodScore}
                      </p>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-auto mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <GoalActions
        goalId={goal.id}
        goalName={goal.name}
        currentValue={goal.currentValue}
        metric={goal.metric}
        relatedRecordsCount={relatedRecords.length}
      />
    </div>
  );
}
