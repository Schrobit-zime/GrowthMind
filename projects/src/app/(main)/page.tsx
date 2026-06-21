"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/auth-provider";
import { useFetch } from "@/hooks/use-api";
import { BookOpen, Briefcase, Activity, Smile, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { StatCard } from "@/components/cards/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

// 图表组件动态导入，减少首屏 JS 体积
const TrendChart = dynamic(() => import("@/components/charts/trend-chart"), {
  ssr: false,
  loading: () => <LoadingSkeleton type="card" />,
});
const RadarChartComponent = dynamic(() => import("@/components/charts/radar-chart"), {
  ssr: false,
});
const Heatmap = dynamic(() => import("@/components/charts/heatmap"), {
  ssr: false,
});

interface RecordItem {
  id: string;
  recordDate: string;
  timeDimension: string;
  learning: Record<string, unknown>;
  work: Record<string, unknown>;
  life: Record<string, unknown>;
  health: Record<string, unknown>;
  mood: Record<string, unknown>;
  moodScore: number | null;
  summary: string | null;
  goalId: string | null;
}

interface GoalItem {
  id: string;
  name: string;
  dimension: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  deadline: string | null;
  status: string;
}

/** 判断 JSONB 维度是否有实际数据 */
function hasDimensionData(dim: Record<string, unknown>): boolean {
  return dim && typeof dim === "object" && Object.keys(dim).length > 0;
}

export default function HomePage() {
  const { profile } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const displayName = profile?.displayName || "用户";

  const {
    data: records,
    loading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useFetch<RecordItem[]>("/api/records?limit=50");

  const {
    data: goals,
    loading: goalsLoading,
    error: goalsError,
  } = useFetch<GoalItem[]>("/api/goals");

  const isLoading = recordsLoading || goalsLoading;
  const error = recordsError || goalsError;

  /** 计算今日各维度汇总 */
  const todaySummary = useMemo(() => {
    if (!records || records.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = records.filter((r) => r.recordDate && r.recordDate.slice(0, 10) === today);

    const learningCount = todayRecords.filter((r) => hasDimensionData(r.learning)).length;
    const workCount = todayRecords.filter((r) => hasDimensionData(r.work)).length;
    const healthCount = todayRecords.filter((r) => hasDimensionData(r.health)).length;
    const moodScores = todayRecords.map((r) => r.moodScore).filter((s): s is number => s != null);
    const avgMood =
      moodScores.length > 0 ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : null;

    return {
      learningCount,
      workCount,
      healthCount,
      avgMood,
      hasTodayData: todayRecords.length > 0,
    };
  }, [records]);

  /** 构建今日卡片数据 */
  const todayCards = useMemo(() => {
    const s = todaySummary;
    return [
      {
        label: "学习",
        value: s ? `${s.learningCount}项` : "--",
        trend: null,
        trendUp: null,
        icon: BookOpen,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
      },
      {
        label: "工作",
        value: s ? `${s.workCount}项` : "--",
        trend: null,
        trendUp: null,
        icon: Briefcase,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
      },
      {
        label: "身体",
        value: s ? `${s.healthCount}项` : "--",
        trend: null,
        trendUp: null,
        icon: Activity,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
      },
      {
        label: "心情",
        value: s?.avgMood != null ? s.avgMood.toFixed(1) : "--",
        trend: null,
        trendUp: null,
        icon: Smile,
        color: "text-pink-400",
        bg: "bg-pink-400/10",
      },
    ];
  }, [todaySummary]);

  /** 从 moodScore 生成趋势数据（最近14天，从旧到新排序） */
  const moodTrendPoints = useMemo(() => {
    if (!records || records.length === 0) return [];
    const sorted = [...records]
      .filter((r): r is RecordItem & { moodScore: number } => r.moodScore != null)
      .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
      .slice(-14);
    if (sorted.length === 0) return [];
    const maxScore = 10;
    const minScore = 1;
    const range = maxScore - minScore;
    return sorted.map((r, i) => ({
      x: 40 + i * (540 / Math.max(sorted.length - 1, 1)),
      y: 140 - ((r.moodScore - minScore) / range) * 120,
      label: r.recordDate.slice(5),
      score: r.moodScore,
    }));
  }, [records]);

  /** 目标进度 */
  const goalItems = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    return goals
      .filter((g) => g.status === "active")
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        name: g.name,
        progress:
          g.targetValue > 0 ? Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) : 0,
        current: g.currentValue,
        target: g.targetValue,
        unit: g.metric || "",
      }));
  }, [goals]);

  /** 热力图数据：最近21天每日记录数 */
  const heatmapData = useMemo(() => {
    if (!records || records.length === 0) return [];
    const days: { date: string; count: number }[] = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = records.filter(
        (r) => r.recordDate && r.recordDate.slice(0, 10) === dateStr,
      ).length;
      days.push({ date: dateStr, count });
    }
    return days;
  }, [records]);

  /** 五维综合评估 */
  const radarScores = useMemo(() => {
    if (!records || records.length === 0) return [0, 0, 0, 0, 0];
    const total = records.length;
    const learningPct = records.filter((r) => hasDimensionData(r.learning)).length / total;
    const workPct = records.filter((r) => hasDimensionData(r.work)).length / total;
    const lifePct = records.filter((r) => hasDimensionData(r.life)).length / total;
    const healthPct = records.filter((r) => hasDimensionData(r.health)).length / total;
    const moodScores = records.filter(
      (r): r is RecordItem & { moodScore: number } => r.moodScore != null,
    );
    const moodPct =
      moodScores.length > 0
        ? moodScores.reduce((a, r) => a + r.moodScore, 0) / moodScores.length / 10
        : 0;
    return [learningPct, workPct, lifePct, healthPct, moodPct];
  }, [records]);

  /** 转换为雷达图所需数据格式 */
  const radarData = useMemo(() => {
    const labels = ["学习", "工作", "生活", "身体", "心情"];
    return labels.map((name, i) => ({
      name,
      value: Math.round(radarScores[i] * 100),
    }));
  }, [radarScores]);

  /** 加载状态 */
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  /** 错误状态 */
  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <ErrorState title="加载失败" message={error} onRetry={refetchRecords} />
      </div>
    );
  }

  /** 空数据状态 */
  const hasAnyData = records && records.length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">下午好，{displayName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* Today overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {todayCards.map((card) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={card.value}
            href={`/records?dimension=${card.label}`}
            icon={
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            }
          />
        ))}
      </div>

      {/* 无数据提示 */}
      {!hasAnyData && (
        <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-8">
          <EmptyState
            icon={<Smile className="w-12 h-12" />}
            title="还没有任何记录数据"
            description="前往「记录」页面添加你的第一条成长记录吧"
            actionLabel="添加记录"
            onAction={() => window.location.assign("/record-form")}
          />
        </div>
      )}

      {/* Trend chart */}
      {hasAnyData && moodTrendPoints.length > 0 && (
        <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">心情趋势</h2>
            <div className="flex gap-1 bg-surface-container rounded-lg p-1">
              {["周", "月"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    tab === "周"
                      ? "bg-primary text-on-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48">
            <TrendChart data={moodTrendPoints} dataKeys={["score"]} xAxisKey="label" />
          </div>
        </div>
      )}

      {/* Expand more */}
      {hasAnyData && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground bg-surface/20 hover:bg-surface/40 rounded-xl border border-border/20 transition-all"
        >
          {showMore ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起图表
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              展开更多
            </>
          )}
        </button>
      )}

      {/* Expanded charts */}
      {hasAnyData && showMore && (
        <div className="space-y-6">
          {/* Radar chart */}
          <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">五维综合评估</h2>
            <div className="h-56">
              <RadarChartComponent data={radarData} maxValue={100} />
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">本月活跃度</h2>
            <Heatmap data={heatmapData.map((d) => ({ date: d.date, value: d.count }))} />
          </div>
        </div>
      )}

      {/* Goal progress */}
      {goalItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">目标进度</h2>
          {goalItems.map((goal) => (
            <Link
              key={goal.id}
              href={`/goal-detail?goal_id=${goal.id}`}
              className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{goal.name}</span>
                <span className="text-xs text-muted-foreground">
                  {goal.current}/{goal.target} {goal.unit}
                </span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
