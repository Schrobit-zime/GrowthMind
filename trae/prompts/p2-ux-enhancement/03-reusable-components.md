# P2-03: 可复用组件抽取

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

从各页面中识别重复模式，抽取为可复用的业务组件，减少代码重复，建立统一的组件目录结构。

## 实施步骤

### 步骤 0：前置依赖确认

⚠️ 此任务依赖 P2-01（shadcn/ui 组件替换）和 P2-02（Recharts 图表迁移）已完成。执行前请确认：
- 所有页面已使用 shadcn/ui 组件
- 图表组件已抽取到 `src/components/charts/`

### 步骤 1：调研现有重复模式

读取以下页面，识别重复的 UI 模式：
- `src/app/(main)/page.tsx` — 仪表盘中的统计卡片
- `src/app/(main)/records/page.tsx` — 记录列表中的记录卡片
- `src/app/(main)/goals/page.tsx` — 目标列表中的目标卡片
- `src/app/(main)/record-form/page.tsx` — 记录表单
- `src/app/(main)/supervise/page.tsx` — 监督面板中的统计卡片
- `src/app/(main)/gateway/page.tsx` — 网关页面的统计卡片

记录各重复模式的：数据结构、props 需求、样式差异、交互行为。

### 步骤 2：创建组件目录结构

```
src/components/
├── ui/              # shadcn/ui 组件（已存在）
├── charts/           # P2-02 创建的图表组件
├── cards/            # 卡片类组件
│   ├── stat-card.tsx
│   ├── record-card.tsx
│   └── goal-card.tsx
├── forms/            # 表单类组件
│   ├── record-form.tsx
│   └── goal-form.tsx
└── shared/           # 通用状态组件
    ├── empty-state.tsx
    ├── error-state.tsx
    └── loading-skeleton.tsx
```

### 步骤 3：实现卡片组件

#### stat-card.tsx — 统计卡片

从仪表盘、监督面板、网关页面中抽取通用统计卡片，支持：
- 标题、数值、单位
- 趋势指示（上升/下降箭头 + 百分比）
- 图标（左侧或顶部）
- 点击跳转（可选）
- 毛玻璃风样式

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  href,
  className,
}: StatCardProps) {
  const router = useRouter();

  const trendIcon = {
    up: <ArrowUp className="w-4 h-4 text-emerald-400" />,
    down: <ArrowDown className="w-4 h-4 text-rose-400" />,
    flat: <Minus className="w-4 h-4 text-gray-400" />,
  };

  const CardWrapper = href ? (
    <Card
      className={`backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer ${className || ""}`}
      onClick={() => router.push(href)}
    />
  ) : (
    <Card className={`backdrop-blur-md bg-white/5 border-white/10 ${className || ""}`} />
  );

  return (
    <CardWrapper>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">{title}</span>
          {icon && <div className="text-[#7C5CFF]">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trendIcon[trend]}
            <span
              className={`text-xs ${
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                    ? "text-rose-400"
                    : "text-gray-400"
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </CardWrapper>
  );
}
```

#### record-card.tsx — 记录卡片

从记录列表页面抽取，支持：
- 记录类型图标、标题、日期
- 数值/标签展示
- 操作按钮（查看详情、编辑、删除）
- 点击进入详情

#### goal-card.tsx — 目标卡片

从目标列表页面抽取，支持：
- 目标名称、描述
- 进度百分比
- 截止日期
- 状态标签（进行中/已完成/已过期）
- 点击进入详情

### 步骤 4：实现表单组件

#### record-form.tsx — 记录表单

从记录录入页面抽取，支持：
- 记录类型选择（下拉或标签切换）
- 数值输入
- 日期选择
- 备注输入
- 表单验证（使用 react-hook-form + zod）
- 提交和取消按钮

#### goal-form.tsx — 目标表单

从目标创建/编辑页面抽取，支持：
- 目标名称、描述
- 目标类型
- 截止日期
- 目标值设定
- 表单验证

### 步骤 5：实现通用状态组件

#### empty-state.tsx — 空态组件

```tsx
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className || ""}`}>
      <div className="text-gray-500 mb-4">
        {icon || <FileQuestion className="w-16 h-16" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm text-center max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="backdrop-blur-md bg-[#7C5CFF]/20 border-[#7C5CFF]/30">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

#### error-state.tsx — 错误态组件

```tsx
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "加载失败",
  message = "请检查网络连接后重试",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className || ""}`}>
      <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="backdrop-blur-md bg-white/5 border-white/10 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </Button>
      )}
    </div>
  );
}
```

#### loading-skeleton.tsx — 骨架屏加载

```tsx
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "detail" | "dashboard";
  count?: number;
}

export function LoadingSkeleton({ type = "card", count = 3 }: LoadingSkeletonProps) {
  if (type === "dashboard") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
            <Skeleton className="h-4 w-20 mb-3 bg-white/10" />
            <Skeleton className="h-8 w-16 mb-2 bg-white/10" />
            <Skeleton className="h-3 w-12 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-white/10" />
              <Skeleton className="h-3 w-60 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-16 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  // 默认 card 骨架
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
          <Skeleton className="h-4 w-24 mb-4 bg-white/10" />
          <Skeleton className="h-6 w-full mb-2 bg-white/10" />
          <Skeleton className="h-4 w-3/4 mb-4 bg-white/10" />
          <Skeleton className="h-8 w-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}
```

### 步骤 6：替换页面中的重复代码

将各页面中的重复代码替换为新组件：

1. 仪表盘 `page.tsx`：统计卡片 → `<StatCard>`
2. 记录列表 `records/page.tsx`：记录卡片 → `<RecordCard>`，空态 → `<EmptyState>`
3. 目标列表 `goals/page.tsx`：目标卡片 → `<GoalCard>`，空态 → `<EmptyState>`
4. 记录录入 `record-form/page.tsx`：表单 → `<RecordForm>`
5. 监督面板 `supervise/page.tsx`：统计卡片 → `<StatCard>`
6. 网关 `gateway/page.tsx`：统计卡片 → `<StatCard>`
7. 所有 loading.tsx 文件：spinner → `<LoadingSkeleton>`
8. 所有 error 边界：简单错误提示 → `<ErrorState>`

## 代码示例

### 仪表盘统计卡片替换

```tsx
// 替换前（仪表盘 page.tsx 中的重复代码）
<div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm text-gray-400">今日记录</span>
    <Activity className="w-5 h-5 text-[#7C5CFF]" />
  </div>
  <div className="flex items-baseline gap-1">
    <span className="text-2xl font-bold text-white">12</span>
    <span className="text-sm text-gray-400">条</span>
  </div>
  <div className="flex items-center gap-1 mt-2">
    <ArrowUp className="w-4 h-4 text-emerald-400" />
    <span className="text-xs text-emerald-400">+20%</span>
  </div>
</div>

// 替换后
<StatCard
  title="今日记录"
  value={12}
  unit="条"
  icon={<Activity className="w-5 h-5" />}
  trend="up"
  trendValue="+20%"
  href="/records"
/>
```

## 验收标准

- [ ] `src/components/cards/stat-card.tsx` 已创建，支持 title/value/unit/icon/trend/href
- [ ] `src/components/cards/record-card.tsx` 已创建，支持记录展示与操作
- [ ] `src/components/cards/goal-card.tsx` 已创建，支持目标展示与进度
- [ ] `src/components/forms/record-form.tsx` 已创建，使用 react-hook-form + zod 验证
- [ ] `src/components/forms/goal-form.tsx` 已创建，使用 react-hook-form + zod 验证
- [ ] `src/components/shared/empty-state.tsx` 已创建，支持自定义图标、文字、操作按钮
- [ ] `src/components/shared/error-state.tsx` 已创建，支持重试按钮
- [ ] `src/components/shared/loading-skeleton.tsx` 已创建，支持 card/list/detail/dashboard 四种类型
- [ ] 仪表盘、监督面板、网关页面的统计卡片已替换为 `<StatCard>`
- [ ] 记录列表页面已使用 `<RecordCard>` 和 `<EmptyState>`
- [ ] 目标列表页面已使用 `<GoalCard>` 和 `<EmptyState>`
- [ ] 所有组件保持毛玻璃风设计风格
- [ ] 通过 `pnpm typecheck` 类型检查
- [ ] 通过 `pnpm lint` 代码规范检查
- [ ] 通过 `pnpm build` 构建成功

## 预估工时

2 人天

## 依赖

- P2-01（shadcn/ui 组件替换）
- P2-02（Recharts 图表迁移）