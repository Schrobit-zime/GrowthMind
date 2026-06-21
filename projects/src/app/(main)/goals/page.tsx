"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import { GoalCard } from "@/components/cards/goal-card";
import { StatCard } from "@/components/cards/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useFetch } from "@/hooks/use-api";

interface GoalItem {
  id: string;
  name: string;
  dimension: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  deadline?: string;
  status: string;
}

export default function GoalsPage() {
  const { session } = useAuth();
  const {
    data: goals,
    loading,
    error,
    refetch: fetchGoals,
  } = useFetch<GoalItem[]>("/api/goals", { enabled: !!session?.access_token });

  const goalsList = goals || [];
  const activeGoals = goalsList.filter((g) => g.status === "active");
  const completedGoals = goalsList.filter((g) => g.status === "completed");

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <PageHeader title="目标管理" description="设定、追踪和管理你的成长目标" />
        <ExportButton type="goals" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="进行中" value={activeGoals.length} />
        <StatCard title="已完成" value={completedGoals.length} />
        <StatCard title="总目标" value={goalsList.length} />
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={4} />
      ) : error ? (
        <ErrorState title="加载失败" message={error} onRetry={fetchGoals} />
      ) : goalsList.length === 0 ? (
        <EmptyState
          title="暂无目标"
          actionLabel="创建目标"
          onAction={() => window.location.assign("/goals")}
        />
      ) : (
        <div className="space-y-3">
          {goalsList.map((goal) => (
            <GoalCard
              key={goal.id}
              id={goal.id}
              name={goal.name}
              dimension={goal.dimension}
              metric={goal.metric}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              deadline={goal.deadline}
              status={goal.status}
            />
          ))}
        </div>
      )}

      <Link href="/goals"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-float hover:shadow-glow transition-all duration-300 hover:scale-105 z-40">
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}