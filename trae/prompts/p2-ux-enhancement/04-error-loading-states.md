# P2-04: 错误边界与加载态完善

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。
- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 核心页面（都在 `src/app/(main)/`）：
  - `page.tsx` — 仪表盘（~400行，含手写 SVG 图表和 Mock 数据）
  - `records/page.tsx` — 记录列表
  - `record-form/page.tsx` — 记录录入（~400行）
  - `record-detail/page.tsx` — 记录详情
  - `goals/page.tsx` — 目标列表
  - `goal-detail/page.tsx` — 目标详情
  - `analysis/page.tsx` — 智能分析
  - `supervise/page.tsx` — 监督面板（~280行）
  - `supervise-user-detail/page.tsx` — 被监督用户详情
  - `supervise-rules/page.tsx` — 提醒规则（~300行）
  - `gateway/page.tsx` — 模型网关（~270行）
- UI 组件目录：`src/components/ui/`（60+ shadcn/ui 组件已安装但几乎未使用）
- 已安装但未使用的关键依赖：recharts, react-hook-form, zod, sonner, next-themes
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 全局样式：`src/app/globals.css`
- 错误边界：`src/app/error.tsx`、`src/app/not-found.tsx`、`src/app/(main)/error.tsx`
- 加载态：`src/app/(main)/loading.tsx`

## 任务目标

完善现有的错误边界和加载态组件，使所有页面在加载中、加载失败、数据为空时都有良好的用户体验，避免白屏和裸奔错误。

## 实施步骤

### 步骤 1：调研现有错误边界和加载态

先读取以下文件，了解当前实现：
- `src/app/error.tsx` — 根级错误边界
- `src/app/not-found.tsx` — 404 页面
- `src/app/(main)/error.tsx` — 主区域错误边界
- `src/app/(main)/loading.tsx` — 主区域加载态

记录当前实现的问题：
- 错误信息是否友好？
- 是否提供重试按钮？
- 加载态是否使用骨架屏？
- 404 页面是否引导用户返回？

### 步骤 2：升级根级错误边界 `src/app/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 将错误上报到监控系统（如 Sentry）
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070A14]">
      <div className="flex flex-col items-center max-w-md mx-auto p-8 text-center">
        {/* 错误图标 */}
        <div className="rounded-full p-4 backdrop-blur-md bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>

        {/* 错误信息 */}
        <h1 className="text-2xl font-bold text-white mb-2">出错了</h1>
        <p className="text-gray-400 mb-2">
          {error.message || "应用遇到了意外错误，请尝试刷新页面。"}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            错误 ID: {error.digest}
          </p>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="backdrop-blur-md bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
          <Button
            asChild
            variant="outline"
            className="backdrop-blur-md bg-white/5 border-white/10 text-white gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 步骤 3：升级 404 页面 `src/app/not-found.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070A14]">
      <div className="flex flex-col items-center max-w-md mx-auto p-8 text-center">
        {/* 404 图标 */}
        <div className="relative mb-6">
          <div className="text-8xl font-bold text-white/5 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full p-4 backdrop-blur-md bg-[#7C5CFF]/10 border border-[#7C5CFF]/20">
              <FileQuestion className="w-10 h-10 text-[#7C5CFF]" />
            </div>
          </div>
        </div>

        {/* 信息 */}
        <h1 className="text-2xl font-bold text-white mb-2">页面未找到</h1>
        <p className="text-gray-400 mb-8">
          您访问的页面不存在或已被移除。
        </p>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            asChild
            className="backdrop-blur-md bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 text-white gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="backdrop-blur-md bg-white/5 border-white/10 text-white gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            后退
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 步骤 4：升级主区域错误边界 `src/app/(main)/error.tsx`

与根级错误边界类似，但添加侧边栏布局保持一致：

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface MainErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({ error, reset }: MainErrorProps) {
  useEffect(() => {
    console.error("Main area error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="rounded-full p-4 backdrop-blur-md bg-rose-500/10 border border-rose-500/20 mb-6">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">页面加载失败</h2>
      <p className="text-gray-400 text-sm text-center max-w-md mb-2">
        {error.message || "加载时发生错误，请重试。"}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-500 mb-6 font-mono">
          错误 ID: {error.digest}
        </p>
      )}
      <Button
        onClick={reset}
        className="backdrop-blur-md bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 text-white gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        重试
      </Button>
    </div>
  );
}
```

### 步骤 5：升级加载态 `src/app/(main)/loading.tsx`

使用骨架屏替代简单 spinner：

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* 页面标题骨架 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-9 w-24 bg-white/10" />
      </div>

      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10"
          >
            <Skeleton className="h-4 w-20 mb-3 bg-white/10" />
            <Skeleton className="h-8 w-16 mb-2 bg-white/10" />
            <Skeleton className="h-3 w-12 bg-white/10" />
          </div>
        ))}
      </div>

      {/* 图表区域骨架 */}
      <div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
        <Skeleton className="h-5 w-32 mb-4 bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>

      {/* 列表骨架 */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-4"
          >
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-white/10" />
              <Skeleton className="h-3 w-60 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-16 bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 步骤 6：为数据获取页面添加错误处理

检查所有包含 API 调用的页面（`records/page.tsx`、`goals/page.tsx`、`analysis/page.tsx` 等），确保：

1. **加载态**：数据获取时展示骨架屏（使用 `<LoadingSkeleton>` 或内联骨架屏）
2. **错误态**：API 调用失败时展示 `<ErrorState>` 组件而非白屏
3. **空态**：数据为空时展示 `<EmptyState>` 组件而非空白页面

如果有 P2-03 的 `<EmptyState>`、`<ErrorState>`、`<LoadingSkeleton>` 组件，优先使用它们。

### 步骤 7：创建全局错误提示组件

```tsx
// src/components/shared/global-error-boundary.tsx
"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("GlobalErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">组件渲染失败</h3>
          <p className="text-gray-400 text-sm text-center mb-6">
            {this.state.error?.message || "未知错误"}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="backdrop-blur-md bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 代码示例

### 页面中的数据获取模式

```tsx
// 各页面应遵循的数据获取模式
"use client";

import { useState, useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error("获取记录失败");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("未知错误"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 加载态
  if (isLoading) return <LoadingSkeleton type="list" count={5} />;

  // 错误态
  if (error) return <ErrorState onRetry={fetchRecords} />;

  // 空态
  if (records.length === 0) {
    return (
      <EmptyState
        title="暂无记录"
        description="开始记录您的第一条数据吧"
        actionLabel="新建记录"
        onAction={() => router.push("/record-form")}
      />
    );
  }

  // 正常渲染
  return <div>{/* 记录列表 */}</div>;
}
```

## 验收标准

- [ ] `src/app/error.tsx` 已升级，包含重试按钮、错误 ID、友好信息、返回首页
- [ ] `src/app/not-found.tsx` 已升级，包含 404 标识、返回首页、后退按钮
- [ ] `src/app/(main)/error.tsx` 已升级，保持侧边栏布局
- [ ] `src/app/(main)/loading.tsx` 已升级为骨架屏（统计卡片 + 图表 + 列表骨架）
- [ ] `src/components/shared/global-error-boundary.tsx` 已创建（Class Component 错误边界）
- [ ] 所有数据获取页面实现"加载态→错误态→空态→正常态"四态覆盖
- [ ] 所有页面在 API 调用失败时展示 `<ErrorState>` 而非白屏
- [ ] 所有加载态使用骨架屏而非简单 spinner
- [ ] 所有空数据场景展示 `<EmptyState>` 引导用户操作
- [ ] 所有错误/加载/空态组件保持毛玻璃风设计风格
- [ ] 通过 `pnpm typecheck` 类型检查
- [ ] 通过 `pnpm lint` 代码规范检查
- [ ] 通过 `pnpm build` 构建成功

## 预估工时

1.5 人天

## 依赖

无（可与其他 P2 任务并行执行）