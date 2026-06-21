"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Server, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

interface GatewayData {
  providers: string[];
  status: string;
  message: string;
}

/** 厂商中文名和图标颜色映射 */
const providerMeta: Record<
  string,
  { label: string; color: string; bg: string; iconColor: string }
> = {
  deepseek: {
    label: "DeepSeek",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    iconColor: "text-blue-400",
  },
  openai: {
    label: "OpenAI",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    iconColor: "text-emerald-400",
  },
  claude: {
    label: "Claude",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    iconColor: "text-amber-400",
  },
  zhipu: {
    label: "智谱",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    iconColor: "text-purple-400",
  },
};

export default function GatewayPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30d");

  const {
    data: gatewayData,
    loading: gatewayLoading,
    error: gatewayError,
    refetch,
  } = useFetch<GatewayData>("/api/gateway", {
    enabled: profile?.role === "admin",
  });

  useEffect(() => {
    if (!authLoading && profile?.role !== "admin") {
      router.replace("/");
    }
  }, [profile, authLoading, router]);

  const isLoading = authLoading || gatewayLoading;

  /** 加载状态 */
  if (authLoading || (isLoading && profile?.role === "admin")) {
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  if (profile?.role !== "admin") return null;

  /** 错误状态 */
  if (gatewayError) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
        <PageHeader title="模型网关管理台" description="统一模型接入层的用量统计与成本分析" />
        <ErrorState title="加载失败" message={gatewayError} onRetry={refetch} />
      </div>
    );
  }

  const providers = gatewayData?.providers || [];
  const isOperational = gatewayData?.status === "operational";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader title="模型网关管理台" description="统一模型接入层的用量统计与成本分析" />

      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="运行状态"
          value={isOperational ? "运行中" : "异常"}
          icon={
            <div className="w-9 h-9 rounded-lg bg-surface/40 flex items-center justify-center">
              {isOperational ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
          }
        />
        <StatCard
          title="接入厂商"
          value={providers.length}
          icon={
            <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
          }
        />
        <StatCard
          title="总调用次数"
          value="—"
          icon={
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
          }
        />
      </div>

      {/* Time range selector */}
      <div className="flex gap-1 bg-surface-container rounded-lg p-1 w-fit">
        {["7d", "30d", "90d", "365d"].map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="sm"
            onClick={() => setTimeRange(t)}
            className={`text-xs font-medium rounded-md ${
              timeRange === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "365d" ? "1年" : `近${t.replace("d", "天")}`}
          </Button>
        ))}
      </div>

      {/* Provider cards */}
      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">已接入厂商</h3>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Server className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无已配置的模型厂商</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((provider) => {
                const meta = providerMeta[provider] || {
                  label: provider,
                  color: "text-muted-foreground",
                  bg: "bg-surface/40",
                  iconColor: "text-muted-foreground",
                };
                return (
                  <div
                    key={provider}
                    className={`flex items-center gap-4 p-4 rounded-xl border border-border/20 ${meta.bg} hover:bg-surface/60 transition-all`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center`}
                    >
                      <Server className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{provider}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">可用</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      {gatewayData?.message && (
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">网关信息</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{gatewayData.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Call details placeholder */}
      <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/20">
          <h3 className="text-sm font-semibold text-foreground">调用明细</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">网关统计数据将在 LLM 调用产生后自动记录</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            使用智能分析功能后，此处将展示用量图表
          </p>
        </div>
      </div>
    </div>
  );
}
