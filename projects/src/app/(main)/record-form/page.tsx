"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const templates = [
  { id: "mood-only", label: "只记心情", icon: "😊", preselect: ["mood"] },
  { id: "work-summary", label: "工作总结", icon: "💼", preselect: ["work"] },
  { id: "study-checkin", label: "学习打卡", icon: "📚", preselect: ["learning"] },
  { id: "full", label: "全面记录", icon: "📋", preselect: ["learning", "work", "life", "health", "mood"] },
];

const timeDimensions = ["daily", "weekly", "monthly", "annual", "morning", "noon", "evening", "custom"];
const timeDimLabels: Record<string, string> = {
  daily: "日报", weekly: "周报", monthly: "月报", annual: "年报",
  morning: "早报", noon: "午报", evening: "晚报", custom: "自定义",
};
const allDimensions = ["learning", "work", "life", "health", "mood"] as const;
const dimensionLabels: Record<string, string> = {
  learning: "学习", work: "工作", life: "生活", health: "身体", mood: "心情",
};

export default function RecordFormPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTemplate, setActiveTemplate] = useState("full");
  const [timeDimension, setTimeDimension] = useState("daily");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(["learning", "work", "life", "health", "mood"]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [moodScore, setMoodScore] = useState(7);
  const [learningHours, setLearningHours] = useState("");
  const [learningContent, setLearningContent] = useState("");
  const [learningMastery, setLearningMastery] = useState(75);
  const [workTasks, setWorkTasks] = useState("");
  const [workEfficiency, setWorkEfficiency] = useState(80);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [weight, setWeight] = useState("");
  const [lifeText, setLifeText] = useState("");
  const [summary, setSummary] = useState("");

  const handleTemplateSelect = (templateId: string) => {
    setActiveTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) setSelectedDimensions(tpl.preselect);
  };

  const toggleDimension = (dim: string) => {
    if (selectedDimensions.includes(dim)) {
      if (selectedDimensions.length > 1)
        setSelectedDimensions(selectedDimensions.filter((d) => d !== dim));
    } else {
      setSelectedDimensions([...selectedDimensions, dim]);
    }
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        timeDimension,
        recordDate,
        moodScore,
        summary,
      };
      if (selectedDimensions.includes("learning"))
        body.learning = { hours: learningHours, content: learningContent, mastery: learningMastery };
      if (selectedDimensions.includes("work"))
        body.work = { tasks: workTasks, efficiency: workEfficiency };
      if (selectedDimensions.includes("health"))
        body.health = { weight, sleepQuality, energy: energyLevel };
      if (selectedDimensions.includes("life"))
        body.life = { notes: lifeText };
      if (selectedDimensions.includes("mood"))
        body.mood = { score: moodScore };

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session": session.access_token },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/record-detail?record_id=${json.data.id}`);
      } else {
        toast.error(json.error || "保存失败");
      }
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20">
        <Button variant="ghost" size="icon" onClick={() => setShowCancelConfirm(true)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">新增记录</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6 pb-24">
        {/* Quick templates */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">快捷模板</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((tpl) => (
              <Button key={tpl.id} variant="ghost" onClick={() => handleTemplateSelect(tpl.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border h-auto ${
                  activeTemplate === tpl.id ? "bg-primary/10 border-primary/40 text-primary" : "backdrop-blur-md bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                }`}>
                <span className="text-2xl">{tpl.icon}</span>
                <span className="text-xs font-medium">{tpl.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Time dimension */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">时间维度</label>
          <div className="flex flex-wrap gap-2">
            {timeDimensions.map((dim) => (
              <Button key={dim} variant="ghost" size="sm" onClick={() => setTimeDimension(dim)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  timeDimension === dim ? "bg-primary text-primary-foreground" : "bg-surface-container text-muted-foreground"
                }`}>
                {timeDimLabels[dim]}
              </Button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">日期</label>
          <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
            className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* Dimension toggles */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">记录维度</label>
          <div className="flex flex-wrap gap-2">
            {allDimensions.map((dim) => (
              <Button key={dim} variant="ghost" size="sm" onClick={() => toggleDimension(dim)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  selectedDimensions.includes(dim) ? "bg-primary text-primary-foreground" : "bg-surface-container text-muted-foreground"
                }`}>
                {dimensionLabels[dim]}
              </Button>
            ))}
          </div>
        </div>

        {/* Learning */}
        {selectedDimensions.includes("learning") && (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">📚 学习状况</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">学习时长（小时）</label>
                <Input type="number" value={learningHours} onChange={(e) => setLearningHours(e.target.value)} placeholder="2.5" step="0.5"
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">学习内容</label>
                <Input type="text" value={learningContent} onChange={(e) => setLearningContent(e.target.value)} placeholder="例如：React 性能优化"
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground">掌握程度</label>
                <span className="text-sm font-bold text-primary">{learningMastery}%</span>
              </div>
              <input type="range" min="0" max="100" value={learningMastery} onChange={(e) => setLearningMastery(Number(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
            </div>
            </CardContent>
          </Card>
        )}

        {/* Work */}
        {selectedDimensions.includes("work") && (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">💼 工作情况</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">完成任务数</label>
                <Input type="number" value={workTasks} onChange={(e) => setWorkTasks(e.target.value)} placeholder="8"
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground">工作效率</label>
                <span className="text-sm font-bold text-primary">{workEfficiency}%</span>
              </div>
              <input type="range" min="0" max="100" value={workEfficiency} onChange={(e) => setWorkEfficiency(Number(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
            </div>
            </CardContent>
          </Card>
        )}

        {/* Health */}
        {selectedDimensions.includes("health") && (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">💪 身体情况</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">体重（kg）</label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70"
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">睡眠质量</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                      <Button key={s} variant="ghost" size="sm" onClick={() => setSleepQuality(s)}
                        className={`flex-1 py-2 text-xs rounded-md h-auto ${sleepQuality === s ? "bg-primary text-primary-foreground" : "bg-surface-container text-muted-foreground"}`}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground">精力水平</label>
                <span className="text-sm font-bold text-primary">{energyLevel}/10</span>
              </div>
              <input type="range" min="1" max="10" value={energyLevel} onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
            </div>
            </CardContent>
          </Card>
        )}

        {/* Life */}
        {selectedDimensions.includes("life") && (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">🏠 生活状况</h3>
            </CardHeader>
            <CardContent>
              <Textarea value={lifeText} onChange={(e) => setLifeText(e.target.value)}
                placeholder="记录你的生活点滴：作息、饮食、运动、社交..." rows={3}
                className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </CardContent>
          </Card>
        )}

        {/* Mood */}
        {selectedDimensions.includes("mood") && (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">😊 心情日记</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">情绪评分</label>
                  <span className="text-lg font-bold text-primary">{moodScore}/10</span>
                </div>
                <input type="range" min="1" max="10" value={moodScore} onChange={(e) => setMoodScore(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">摘要</label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="简要记录今天的状态..." rows={2}
            className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/80 backdrop-blur-xl border-t border-border/20 px-4 py-4 flex gap-3 z-40">
        <Button variant="ghost" onClick={() => setShowCancelConfirm(true)}
          className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground bg-surface-container rounded-xl h-12">
          取消
        </Button>
        <Button onClick={handleSave} disabled={saving}
          className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-float hover:shadow-glow transition-all disabled:opacity-50 h-12">
          {saving ? "保存中..." : "保存记录"}
        </Button>
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="backdrop-blur-2xl bg-white/5 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">放弃编辑？</AlertDialogTitle>
            <AlertDialogDescription>
              当前填写的内容将不会被保存
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="backdrop-blur-md bg-white/5 border-white/10 text-muted-foreground">继续编辑</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/records")} className="bg-destructive text-white">放弃</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
