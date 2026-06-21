"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const errorId = useMemo(
    () =>
      `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
    []
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-2xl p-8 max-w-md w-full text-center shadow-float">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          出了点问题
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "页面加载时发生错误，请稍后重试。"}
        </p>

        <div className="text-xs text-muted-foreground/60 mb-6 font-mono">
          错误ID: {errorId}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-medium text-sm rounded-xl shadow-float hover:shadow-glow transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border/30 text-muted-foreground hover:text-foreground font-medium text-sm rounded-xl bg-surface/40 backdrop-blur-sm hover:bg-surface-container transition-all"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
