"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-2xl p-8 max-w-md w-full text-center shadow-float">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-5xl font-bold text-primary">404</span>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">页面不存在</h2>
        <p className="text-sm text-muted-foreground mb-8">你访问的页面不存在或已被移除。</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border/30 text-muted-foreground hover:text-foreground font-medium text-sm rounded-xl bg-surface/40 backdrop-blur-sm hover:bg-surface-container transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            后退
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-medium text-sm rounded-xl shadow-float hover:shadow-glow transition-all"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
