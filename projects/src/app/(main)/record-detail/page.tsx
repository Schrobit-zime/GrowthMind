import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Briefcase, Activity, Smile } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RecordActions } from "@/components/records/record-actions";
import { getRecordById } from "@/lib/data/records";
import type { Metadata } from "next";

const timeDimLabel: Record<string, string> = {
  weekly: "周报",
  monthly: "月报",
  annual: "年报",
  morning: "早报",
  noon: "午报",
  evening: "晚报",
  quick_note: "随时记",
  custom: "自定义",
};

interface Props {
  searchParams: Promise<{ record_id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { record_id } = await searchParams;
  if (!record_id) return { title: "记录详情 - GrowthMind" };

  const record = await getRecordById(record_id);
  if (!record) return { title: "记录不存在 - GrowthMind" };

  return {
    title: `${timeDimLabel[record.timeDimension] || record.timeDimension} · ${record.recordDate} - GrowthMind`,
  };
}

export default async function RecordDetailPage({ searchParams }: Props) {
  const { record_id } = await searchParams;

  if (!record_id) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/records"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">记录详情</h1>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-sm text-muted-foreground">未指定记录 ID</p>
        </div>
      </div>
    );
  }

  const record = await getRecordById(record_id);

  if (!record) {
    notFound();
  }

  const learning = (record.learning as Record<string, unknown>) || {};
  const work = (record.work as Record<string, unknown>) || {};
  const health = (record.health as Record<string, unknown>) || {};
  const mood = (record.mood as Record<string, unknown>) || {};

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/records"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">记录详情</h1>
      </div>

      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary">
              {timeDimLabel[record.timeDimension] || record.timeDimension}
            </span>
            <span className="text-sm text-muted-foreground">{record.recordDate}</span>
            {record.moodScore != null && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground">心情</span>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{record.moodScore}</span>
                </div>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            )}
          </div>
          {record.goalId && (
            <Link
              href={`/goal-detail?goal_id=${record.goalId}`}
              className="inline-block mt-3 text-sm text-accent hover:underline"
            >
              关联目标 →
            </Link>
          )}
        </CardContent>
      </Card>

      {record.summary && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">摘要</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{record.summary}</p>
          </CardContent>
        </Card>
      )}

      {Object.keys(learning).length > 0 && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> 学习状况
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {learning.hours !== undefined && (
                <div>
                  <span className="text-muted-foreground">学习时长</span>
                  <p className="text-foreground font-medium">{String(learning.hours)} 小时</p>
                </div>
              )}
              {learning.content ? (
                <div>
                  <span className="text-muted-foreground">学习内容</span>
                  <p className="text-foreground font-medium">{String(learning.content)}</p>
                </div>
              ) : null}
              {learning.mastery !== undefined && (
                <div>
                  <span className="text-muted-foreground">掌握程度</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Number(learning.mastery)}%`,
                        }}
                      />
                    </div>
                    <span className="text-primary font-medium">{String(learning.mastery)}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(work).length > 0 && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" /> 工作情况
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {work.tasks !== undefined && (
                <div>
                  <span className="text-muted-foreground">完成任务</span>
                  <p className="text-foreground font-medium">{String(work.tasks)} 个</p>
                </div>
              )}
              {work.efficiency !== undefined && (
                <div>
                  <span className="text-muted-foreground">工作效率</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{
                          width: `${Number(work.efficiency)}%`,
                        }}
                      />
                    </div>
                    <span className="text-success font-medium">{String(work.efficiency)}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(health).length > 0 && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" /> 身体情况
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {health.weight !== undefined && (
                <div>
                  <span className="text-muted-foreground">体重</span>
                  <p className="text-foreground font-medium">{String(health.weight)} kg</p>
                </div>
              )}
              {health.sleepQuality !== undefined && (
                <div>
                  <span className="text-muted-foreground">睡眠质量</span>
                  <p className="text-foreground font-medium">{String(health.sleepQuality)}/10</p>
                </div>
              )}
              {health.energy !== undefined && (
                <div>
                  <span className="text-muted-foreground">精力水平</span>
                  <p className="text-foreground font-medium">{String(health.energy)}/10</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(mood).length > 0 && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Smile className="w-4 h-4 text-pink-400" /> 心情日记
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {mood.score !== undefined && (
                <div>
                  <span className="text-muted-foreground">情绪评分</span>
                  <p className="text-foreground font-medium text-lg">{String(mood.score)}/10</p>
                </div>
              )}
              {mood.stress !== undefined && (
                <div>
                  <span className="text-muted-foreground">压力等级</span>
                  <p className="text-foreground font-medium">{String(mood.stress)}/5</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <RecordActions recordId={record.id} />
    </div>
  );
}
