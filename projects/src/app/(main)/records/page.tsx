"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import { RecordCard } from "@/components/cards/record-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { TagGroup } from "@/components/shared/tag-group";

const timeDimensions = ["全部", "周报", "月报", "年报", "早报", "午报", "晚报", "随时记"];

const dimensionMap: Record<string, string> = {
  全部: "all",
  周报: "weekly",
  月报: "monthly",
  年报: "annual",
  早报: "morning",
  午报: "noon",
  晚报: "evening",
  随时记: "quick_note",
};

interface RecordItem {
  id: string;
  timeDimension: string;
  recordDate: string;
  learning?: Record<string, unknown>;
  work?: Record<string, unknown>;
  life?: Record<string, unknown>;
  health?: Record<string, unknown>;
  mood?: Record<string, unknown>;
  moodScore?: number;
  summary?: string;
  goalId?: string;
}

export default function RecordsPage() {
  const { session } = useAuth();
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(["全部"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      const dim = selectedDimensions[0];
      if (dim && dim !== "全部") {
        params.set("dimension", dimensionMap[dim] || dim);
      }
      const res = await fetch(`/api/records?${params}`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "获取记录数据失败");
      }
      setRecords(json.data || []);
    } catch (err) {
      console.error("Failed to fetch records:", err);
      const message = err instanceof Error ? err.message : "获取记录数据失败，请检查网络连接后重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, selectedDimensions]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const toggleDimension = (dim: string) => {
    if (dim === "全部") {
      setSelectedDimensions(["全部"]);
      return;
    }
    let next = selectedDimensions.filter((d) => d !== "全部");
    if (next.includes(dim)) {
      next = next.filter((d) => d !== dim);
    } else {
      next = [...next, dim];
    }
    setSelectedDimensions(next.length === 0 ? ["全部"] : next);
  };

  const getActiveDimensions = (rec: RecordItem) => {
    const dims: string[] = [];
    if (rec.learning && Object.keys(rec.learning).length > 0) dims.push("learning");
    if (rec.work && Object.keys(rec.work).length > 0) dims.push("work");
    if (rec.life && Object.keys(rec.life).length > 0) dims.push("life");
    if (rec.health && Object.keys(rec.health).length > 0) dims.push("health");
    if (rec.mood && Object.keys(rec.mood).length > 0) dims.push("mood");
    return dims;
  };

  const filtered = records.filter((r) => {
    if (searchQuery && !r.summary?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const tagItems = timeDimensions.map((dim) => ({ key: dim, label: dim }));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="记录列表" description="浏览和管理你的所有成长记录" />

      <div className="space-y-4">
        <TagGroup items={tagItems} selectedKeys={selectedDimensions} onToggle={toggleDimension} />

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记录..."
              className="w-full pl-10 pr-4 py-2 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <ExportButton type="records" />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={5} />
      ) : error ? (
        <ErrorState title="加载失败" message={error} onRetry={fetchRecords} />
      ) : filtered.length === 0 ? (
        <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
          <EmptyState
            title="暂无记录"
            actionLabel="新增记录"
            onAction={() => window.location.assign("/record-form")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const dims = getActiveDimensions(record);
            return (
              <RecordCard
                key={record.id}
                id={record.id}
                timeDimension={record.timeDimension}
                recordDate={record.recordDate}
                summary={record.summary}
                moodScore={record.moodScore}
                activeDimensions={dims}
                href={`/record-detail?record_id=${record.id}`}
              />
            );
          })}
        </div>
      )}

      <Link
        href="/record-form"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-float hover:shadow-glow transition-all duration-300 hover:scale-105 z-40"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}
