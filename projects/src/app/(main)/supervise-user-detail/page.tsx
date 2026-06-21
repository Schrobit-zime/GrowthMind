"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Bell, Send, BookOpen, Briefcase, Activity, Smile, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const tabs = ["概览", "记录", "目标", "分析"];

export default function SuperviseUserDetailPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("概览");
  const [showSendAlert, setShowSendAlert] = useState(false);

  useEffect(() => {
    if (!isLoading && profile?.role !== "admin") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  if (isLoading || profile?.role !== "admin") return null;

  const user = { id: "u_001", name: "张三", avatar: "张", status: "active" };

  const todayCards = [
    { label: "学习", value: "2.5h", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "工作", value: "8项", icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "心情", value: "7.5", icon: Smile, color: "text-pink-400", bg: "bg-pink-400/10" },
    { label: "身体", value: "7h", icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  const goals = [
    { name: "每日学习2小时", progress: 65, current: 78, target: 120, unit: "小时" },
    { name: "每周健身3次", progress: 67, current: 8, target: 12, unit: "次" },
    { name: "月度阅读4本书", progress: 50, current: 2, target: 4, unit: "本" },
    { name: "每日运动30分钟", progress: 80, current: 24, target: 30, unit: "天" },
  ];

  const recentRecords = [
    { id: "rec_001", date: "2025-06-20", timeDimension: "日报", summary: "完成 React 性能优化学习", moodScore: 8 },
    { id: "rec_007", date: "2025-06-19", timeDimension: "日报", summary: "TypeScript 高级类型学习", moodScore: 6 },
    { id: "rec_010", date: "2025-06-18", timeDimension: "晚报", summary: "今天有些疲惫但完成了重要任务", moodScore: 7 },
    { id: "rec_012", date: "2025-06-17", timeDimension: "日报", summary: "学习+游泳1小时", moodScore: 7 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified topbar */}
      <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20">
        <Link href="/supervise" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {user.avatar}
        </div>
        <span className="text-lg font-semibold text-foreground">{user.name}</span>
        <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">活跃</span>
        <div className="flex-1" />
        <Link
          href={`/supervise-rules?user_id=${user.id}`}
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
        {/* Tabs */}
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

        {/* Overview tab */}
        {activeTab === "概览" && (
          <div className="space-y-6">
            {/* Today cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {todayCards.map((card) => (
                <Card key={card.label} className="backdrop-blur-md bg-white/5 border-white/10">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                      <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trend chart */}
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader>
                  <h3 className="text-sm font-semibold text-foreground">近7天心情趋势</h3>
                </CardHeader>
                <CardContent>
                <svg viewBox="0 0 500 140" className="w-full h-full">
                  <defs>
                    <linearGradient id="trendGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(124, 92, 255)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(124, 92, 255)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="30" y1={20 + i * 35} x2="490" y2={20 + i * 35} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  <path d="M30,100 L100,90 L170,110 L240,70 L310,50 L380,60 L450,40 L490,50 L490,140 L30,140 Z" fill="url(#trendGrad3)" />
                  <path d="M30,100 L100,90 L170,110 L240,70 L310,50 L380,60 L450,40 L490,50" fill="none" stroke="rgb(124, 92, 255)" strokeWidth="2" strokeLinecap="round" />
                  {["6/14","6/15","6/16","6/17","6/18","6/19","6/20"].map((d, i) => (
                    <text key={i} x={30 + i * 75} y="135" textAnchor="middle" fill="rgba(154,167,199,0.6)" fontSize="9">{d}</text>
                  ))}
                </svg>
                </CardContent>
              </Card>

            {/* Goals */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">目标进度</h3>
              <div className="space-y-3">
                {goals.map((g) => (
                  <Card key={g.name} className="backdrop-blur-md bg-white/5 border-white/10">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-xs text-muted-foreground">{g.current}/{g.target} {g.unit}</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent records */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">最近记录</h3>
              <div className="space-y-2">
                {recentRecords.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/record-detail?record_id=${rec.id}`}
                    className="block bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-3 hover:bg-surface/60 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">{rec.timeDimension}</span>
                          <span className="text-xs text-muted-foreground">{rec.date}</span>
                        </div>
                        <p className="text-sm text-foreground">{rec.summary}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{rec.moodScore}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
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

      {/* Send alert panel */}
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
                <Button variant="ghost" onClick={() => setShowSendAlert(false)} className="flex-1 py-3 text-sm font-medium text-muted-foreground bg-surface-container rounded-xl h-12">取消</Button>
                <Button onClick={() => setShowSendAlert(false)} className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-float h-12">发送</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
