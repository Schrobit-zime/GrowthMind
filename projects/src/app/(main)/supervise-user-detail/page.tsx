"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bell, Send, BookOpen, Briefcase, Activity, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";

const tabs = ["概览", "记录", "目标", "分析"];

interface SupervisedUserData {
  id: string;
  supervisedUserId: string;
  supervised?: { displayName?: string; avatar_url?: string } | null;
}

interface RecordItem {
  id: string;
  recordDate: string;
  timeDimension: string;
  learning?: Record<string, unknown>;
  work?: Record<string, unknown>;
  life?: Record<string, unknown>;
  health?: Record<string, unknown>;
  mood?: Record<string, unknown>;
  moodScore?: number;
  summary?: string;
}

interface GoalItem {
  id: string;
  name: string;
  dimension: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  status: string;
}

function UserDetailContent() {
  const { profile, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");

  const [activeTab, setActiveTab] = useState("概览");
  const [showSendAlert, setShowSendAlert] = useState(false);

  // 用户数据
  const [userData, setUserData] = useState<SupervisedUserData | null>(null);

  // 记录数据
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // 目标数据
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.role !== "admin") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  // 获取用户数据
  const fetchUserData = useCallback(async () => {
    if (!session?.access_token || !userId) return;
    try {
      const res = await fetch(`/api/supervise?supervisedUserId=${encodeURIComponent(userId)}`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setUserData(Array.isArray(data) ? data[0] : data);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    } finally {
      // 用户数据加载完成
    }
  }, [session?.access_token, userId]);

  // 获取记录数据
  const fetchRecords = useCallback(async () => {
    if (!session?.access_token || !userId) return;
    try {
      const res = await fetch(`/api/records?userId=${encodeURIComponent(userId)}&limit=10`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
    } catch (err) {
      console.error("Failed to fetch records:", err);
      setRecordsError("获取记录数据失败");
    } finally {
      setRecordsLoading(false);
    }
  }, [session?.access_token, userId]);

  // 获取目标数据
  const fetchGoals = useCallback(async () => {
    if (!session?.access_token || !userId) return;
    try {
      const res = await fetch(`/api/goals?userId=${encodeURIComponent(userId)}`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) setGoals(json.data || []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setGoalsError("获取目标数据失败");
    } finally {
      setGoalsLoading(false);
    }
  }, [session?.access_token, userId]);

  useEffect(() => {
    fetchUserData();
    fetchRecords();
    fetchGoals();
  }, [fetchUserData, fetchRecords, fetchGoals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20">
          <Link
            href="/supervise"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-lg font-semibold text-foreground">用户详情</span>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState title="参数错误" message="未指定用户 ID" />
        </div>
      </div>
    );
  }

  const displayName = userData?.supervised?.displayName || `用户 ${userId.slice(0, 8)}`;
  const avatarChar = (userData?.supervised?.displayName || userId.slice(0, 2))
    .charAt(0)
    .toUpperCase();

  // 计算概览统计
  const todayRecords = records.filter(
    (r) => r.recordDate?.slice(0, 10) === new Date().toISOString().slice(0, 10),
  );
  const learningCount = todayRecords.filter(
    (r) => r.learning && Object.keys(r.learning).length > 0,
  ).length;
  const workCount = todayRecords.filter((r) => r.work && Object.keys(r.work).length > 0).length;
  const moodScores = todayRecords.map((r) => r.moodScore).filter((s): s is number => s != null);
  const avgMood =
    moodScores.length > 0 ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : 0;
  const healthCount = todayRecords.filter(
    (r) => r.health && Object.keys(r.health).length > 0,
  ).length;

  const todayCards = [
    {
      label: "学习",
      value: `${learningCount}项`,
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "工作",
      value: `${workCount}项`,
      icon: Briefcase,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "心情",
      value: avgMood > 0 ? avgMood.toFixed(1) : "—",
      icon: Smile,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
    },
    {
      label: "身体",
      value: `${healthCount}项`,
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ];

  const goalItems = goals
    .filter((g) => g.status === "active")
    .map((g) => ({
      name: g.name,
      progress:
        g.targetValue > 0 ? Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) : 0,
      current: g.currentValue,
      target: g.targetValue,
      unit: g.metric || "",
    }));

  // 心情趋势数据
  const moodTrend = records
    .filter((r): r is RecordItem & { moodScore: number } => r.moodScore != null)
    .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
    .slice(-7);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部栏 */}
      <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20">
        <Link
          href="/supervise"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {avatarChar}
        </div>
        <span className="text-lg font-semibold text-foreground">{displayName}</span>
        <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">活跃</span>
        <div className="flex-1" />
        <Link
          href={`/supervise-rules?user_id=${userId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-surface-container rounded-lg transition-colors"
        >
          <Bell className="w-3.5 h-3.5" /> 提醒规则
        </Link>
        <Button
          onClick={() => setShowSendAlert(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg shadow-float"
        >
          <Send className="w-3.5 h-3.5" /> 发送提醒
        </Button>
      </header>

      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        {/* 标签页 */}
        <div className="flex gap-1 bg-surface-container rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* 概览标签页 */}
        {activeTab === "概览" && (
          <div className="space-y-6">
            {/* 概览卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {todayCards.map((card) => (
                <Card key={card.label} className="backdrop-blur-md bg-white/5 border-white/10">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                      <div
                        className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                      >
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 心情趋势图 */}
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardHeader>
                <h3 className="text-sm font-semibold text-foreground">近7天心情趋势</h3>
              </CardHeader>
              <CardContent>
                {moodTrend.length > 0 ? (
                  <svg viewBox="0 0 500 140" className="w-full h-full">
                    <defs>
                      <linearGradient id="trendGrad3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(124, 92, 255)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="rgb(124, 92, 255)" stopOpacity="0" />
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
                      d={`M30,${120 - (moodTrend[0].moodScore || 5) * 10} ${moodTrend.map((d, i) => `L${30 + i * (460 / Math.max(moodTrend.length - 1, 1))},${120 - (d.moodScore || 5) * 10}`).join(" ")} L490,140 L30,140 Z`}
                      fill="url(#trendGrad3)"
                    />
                    <path
                      d={`M30,${120 - (moodTrend[0].moodScore || 5) * 10} ${moodTrend.map((d, i) => `L${30 + i * (460 / Math.max(moodTrend.length - 1, 1))},${120 - (d.moodScore || 5) * 10}`).join(" ")}`}
                      fill="none"
                      stroke="rgb(124, 92, 255)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {moodTrend
                      .filter((_, i) => i % 2 === 0)
                      .map((d, i) => (
                        <text
                          key={i}
                          x={30 + i * 2 * (460 / Math.max(moodTrend.length - 1, 1))}
                          y="135"
                          textAnchor="middle"
                          fill="rgba(154,167,199,0.6)"
                          fontSize="9"
                        >
                          {d.recordDate?.slice(5)}
                        </text>
                      ))}
                  </svg>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无心情数据</p>
                )}
              </CardContent>
            </Card>

            {/* 目标进度 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">目标进度</h3>
              {goalsLoading ? (
                <LoadingSkeleton type="list" count={2} />
              ) : goalsError ? (
                <ErrorState title="加载失败" message={goalsError} onRetry={fetchGoals} />
              ) : goalItems.length === 0 ? (
                <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
                  <CardContent className="py-8">
                    <p className="text-sm text-muted-foreground">暂无目标数据</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {goalItems.map((g) => (
                    <Card key={g.name} className="backdrop-blur-md bg-white/5 border-white/10">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{g.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {g.current}/{g.target} {g.unit}
                          </span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 最近记录 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">最近记录</h3>
              {recordsLoading ? (
                <LoadingSkeleton type="list" count={3} />
              ) : recordsError ? (
                <ErrorState title="加载失败" message={recordsError} onRetry={fetchRecords} />
              ) : records.length === 0 ? (
                <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
                  <CardContent className="py-8">
                    <p className="text-sm text-muted-foreground">暂无记录数据</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {records.map((rec) => (
                    <Link
                      key={rec.id}
                      href={`/record-detail?record_id=${rec.id}`}
                      className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-3 hover:bg-surface/60 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                              {rec.timeDimension}
                            </span>
                            <span className="text-xs text-muted-foreground">{rec.recordDate}</span>
                          </div>
                          <p className="text-sm text-foreground">{rec.summary || "无摘要"}</p>
                        </div>
                        {rec.moodScore != null && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{rec.moodScore}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 其他标签页占位 */}
        {activeTab !== "概览" && (
          <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
              {activeTab === "记录" && "此处将展示该用户的所有记录列表，支持筛选和搜索。"}
              {activeTab === "目标" && "此处将展示该用户的所有目标及进度详情。"}
              {activeTab === "分析" && "此处将展示该用户的智能分析报告。"}
            </p>
          </div>
        )}
      </div>

      {/* 发送提醒面板 */}
      {showSendAlert && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSendAlert(false)} />
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 backdrop-blur-2xl border-t border-border/30 rounded-t-2xl p-6 z-50 shadow-float animate-slideUp">
            <h3 className="text-lg font-semibold text-foreground mb-4">发送提醒</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">提醒类型</label>
                <select className="w-full px-4 py-3 bg-surface-container border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>未记录提醒</option>
                  <option>目标进度提醒</option>
                  <option>鼓励消息</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">提醒内容</label>
                <Textarea
                  rows={3}
                  placeholder="输入提醒内容..."
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowSendAlert(false)}
                  className="flex-1 py-3 text-sm font-medium text-muted-foreground bg-surface-container rounded-xl h-12"
                >
                  取消
                </Button>
                <Button
                  onClick={() => setShowSendAlert(false)}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-float h-12"
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuperviseUserDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UserDetailContent />
    </Suspense>
  );
}
