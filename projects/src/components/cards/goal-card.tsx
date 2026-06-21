import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

const dimLabel: Record<string, string> = {
  learning: "学习", work: "工作", life: "生活", health: "身体", mood: "心情",
};

interface GoalCardProps {
  id: string;
  name: string;
  dimension: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  deadline?: string | null;
  status: string;
  href?: string;
}

export function GoalCard({ id, name, dimension, metric, currentValue, targetValue, deadline, status, href }: GoalCardProps) {
  const progress = targetValue === 0 ? 0 : Math.min(100, Math.round((currentValue / targetValue) * 100));
  const linkHref = href || `/goal-detail?goal_id=${id}`;

  return (
    <Link
      key={id}
      href={linkHref}
      className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-md ${
              status === "completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            }`}>
              {status === "completed" ? "已完成" : "进行中"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 inline-block">
            {dimLabel[dimension] || dimension} · 截止 {deadline || "无"}
          </span>
        </div>
        {status === "completed" && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            status === "completed" ? "bg-success" : "bg-gradient-to-r from-primary to-accent"
          }`} style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-bold text-foreground w-10 text-right">{progress}%</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {currentValue}/{targetValue} {metric}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
