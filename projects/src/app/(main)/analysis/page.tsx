"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSSE } from "@/hooks/use-sse";
import { Sparkles, Clock, Square, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const timeRanges = [
  { label: "近7天", value: "7d" },
  { label: "近30天", value: "30d" },
  { label: "近90天", value: "90d" },
];
const dimensionOptions = ["学习", "工作", "生活", "身体", "心情"];
const dimensionValues: Record<string, string> = {
  学习: "learning",
  工作: "work",
  生活: "life",
  身体: "health",
  心情: "mood",
};
const analysisTypes = [
  { label: "趋势分析", value: "trend" },
  { label: "综合评估", value: "assessment" },
  { label: "优化建议", value: "suggestion" },
];

interface HistoryItem {
  id: string;
  analysisType: string;
  created_at: string;
  dimensions: string[];
  result: string;
}

export default function AnalysisPage() {
  const { session } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(["学习", "工作", "心情"]);
  const [analysisType, setAnalysisType] = useState("trend");
  const [noDataWarning, setNoDataWarning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fetchingRecords, setFetchingRecords] = useState(false);

  const {
    text: result,
    streaming,
    error: sseError,
    start,
    stop,
    reset,
  } = useSSE({
    url: "/api/analysis",
    onDone: () => {
      fetchHistory();
    },
  });

  const fetchHistory = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setLoadError(null);
      const res = await fetch(`/api/analysis?limit=5`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "获取分析历史失败");
      }
      setHistory(json.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "获取分析历史失败";
      setLoadError(message);
    }
  }, [session]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleDimension = (dim: string) => {
    if (selectedDimensions.includes(dim)) {
      if (selectedDimensions.length > 1)
        setSelectedDimensions(selectedDimensions.filter((d) => d !== dim));
    } else {
      setSelectedDimensions([...selectedDimensions, dim]);
    }
  };

  const handleAnalyze = async () => {
    if (!session?.access_token) return;
    setNoDataWarning(false);
    setLoadError(null);
    setFetchingRecords(true);
    reset();

    try {
      const now = new Date();
      const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const from = new Date(now.getTime() - daysBack * 86400000).toISOString().split("T")[0];
      const to = now.toISOString().split("T")[0];

      const recRes = await fetch(`/api/records?from=${from}&to=${to}&limit=50`, {
        headers: { "x-session": session.access_token },
      });
      const recJson = await recRes.json();

      if (!recRes.ok || !recJson.success) {
        throw new Error(recJson.error || "获取记录数据失败");
      }

      if (!recJson.data || recJson.data.length === 0) {
        setNoDataWarning(true);
        setFetchingRecords(false);
        return;
      }

      const dims = selectedDimensions.map((d) => dimensionValues[d]).filter(Boolean);

      setFetchingRecords(false);
      start({
        timeRange,
        dimensions: dims,
        analysisType,
        records: recJson.data,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "获取记录数据失败";
      setLoadError(message);
      setFetchingRecords(false);
    }
  };

  const isLoading = fetchingRecords || streaming;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">智能分析</h1>
        <p className="text-sm text-muted-foreground mt-1">AI 驱动的成长数据分析与个性化建议</p>
      </div>

      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardContent className="space-y-5 pt-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">时间范围</label>
            <div className="flex flex-wrap gap-2">
              {timeRanges.map((tr) => (
                <Button
                  key={tr.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(tr.value)}
                  className={
                    timeRange === tr.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container text-muted-foreground"
                  }
                >
                  {tr.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">分析维度</label>
            <div className="flex flex-wrap gap-2">
              {dimensionOptions.map((dim) => (
                <Button
                  key={dim}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDimension(dim)}
                  className={
                    selectedDimensions.includes(dim)
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container text-muted-foreground"
                  }
                >
                  {dim}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">分析类型</label>
            <div className="flex flex-wrap gap-2">
              {analysisTypes.map((at) => (
                <Button
                  key={at.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnalysisType(at.value)}
                  className={
                    analysisType === at.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container text-muted-foreground"
                  }
                >
                  {at.label}
                </Button>
              ))}
            </div>
          </div>

          {noDataWarning && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4">
              <p className="text-sm text-amber-400">
                ⚠️ 该时间范围内暂无记录数据，请先记录后再进行分析。
              </p>
            </div>
          )}

          {sseError && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{sseError}</p>
            </div>
          )}

          {loadError && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{loadError}</p>
            </div>
          )}

          <div className="flex gap-3">
            {streaming ? (
              <Button
                onClick={stop}
                variant="ghost"
                className="flex-1 py-3.5 bg-red-500/20 border border-red-400/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 h-12"
              >
                <Square className="w-5 h-5" />
                停止生成
              </Button>
            ) : (
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl shadow-float hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed h-12"
              >
                <Sparkles className="w-5 h-5" />
                {fetchingRecords ? "获取数据中..." : result ? "重新生成" : "开始分析"}
              </Button>
            )}
            {result && !streaming && (
              <Button
                onClick={reset}
                variant="ghost"
                className="px-4 py-3.5 bg-surface-container border border-border/20 text-muted-foreground font-semibold rounded-xl hover:bg-surface/60 h-12"
              >
                <RefreshCw className="w-4 h-4" />
                清空
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {result}
              {streaming && (
                <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">历史分析</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary">
                    {item.analysisType === "trend"
                      ? "趋势分析"
                      : item.analysisType === "assessment"
                        ? "综合评估"
                        : "优化建议"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{" "}
                    {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.result?.slice(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
