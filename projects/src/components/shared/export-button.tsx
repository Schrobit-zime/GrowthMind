"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export function ExportButton({ type }: { type: "records" | "goals" }) {
  const { session } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: string) => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/export?type=${type}&format=${format}`, {
        headers: { "x-session": session.access_token },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "导出失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setLoading(false);
      setShow(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-surface-container border-none rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-4 h-4" />
        {loading ? "导出中..." : "导出"}
      </button>
      {show && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShow(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-surface/95 backdrop-blur-xl border border-border/20 rounded-xl shadow-float z-20 py-1 min-w-[140px]">
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-container transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              导出 CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-container transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              导出 PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
