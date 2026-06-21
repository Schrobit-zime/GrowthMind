"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MainError]", error);
  }, [error]);

  const [errorId] = useState(
    () =>
      `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 lg:p-8">
      <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-2xl p-6 lg:p-8 max-w-md w-full text-center shadow-float">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">加载失败</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {error.message || "数据加载时发生错误"}
        </p>

        <div className="text-xs text-muted-foreground/60 mb-5 font-mono">{errorId}</div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 shadow-float hover:shadow-glow transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    </div>
  );
}
