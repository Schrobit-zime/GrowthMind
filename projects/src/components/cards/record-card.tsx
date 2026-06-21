import Link from "next/link";
import { ChevronRight, BookOpen, Briefcase, Heart, Activity, Smile } from "lucide-react";

const dimensionIcons: Record<string, React.ElementType> = {
  learning: BookOpen,
  work: Briefcase,
  life: Heart,
  health: Activity,
  mood: Smile,
};

const dimensionColors: Record<string, string> = {
  learning: "text-blue-400 bg-blue-400/10",
  work: "text-emerald-400 bg-emerald-400/10",
  life: "text-amber-400 bg-amber-400/10",
  health: "text-rose-400 bg-rose-400/10",
  mood: "text-pink-400 bg-pink-400/10",
};

const timeDimLabel: Record<string, string> = {
  daily: "日报",
  weekly: "周报",
  monthly: "月报",
  annual: "年报",
  morning: "早报",
  noon: "午报",
  evening: "晚报",
  custom: "自定义",
};

interface RecordCardProps {
  id: string;
  timeDimension: string;
  recordDate: string;
  summary?: string | null;
  moodScore?: number | null;
  activeDimensions: string[];
  href: string;
}

export function RecordCard({
  id,
  timeDimension,
  recordDate,
  summary,
  moodScore,
  activeDimensions,
  href,
}: RecordCardProps) {
  return (
    <Link
      key={id}
      href={href}
      className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="flex gap-1 flex-shrink-0">
          {activeDimensions.map((dim) => {
            const Icon = dimensionIcons[dim];
            return Icon ? (
              <div
                key={dim}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${dimensionColors[dim]}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ) : null;
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary">
              {timeDimLabel[timeDimension] || timeDimension}
            </span>
            <span className="text-xs text-muted-foreground">{recordDate}</span>
          </div>
          <p className="text-sm text-foreground line-clamp-2">{summary || "无摘要"}</p>
        </div>

        {moodScore && (
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{moodScore}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">心情</span>
          </div>
        )}

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
