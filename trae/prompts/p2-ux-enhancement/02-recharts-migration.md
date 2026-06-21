# P2-02: Recharts 图表迁移（替换手写 SVG）

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

使用 Recharts（已安装但未使用）替换仪表盘、目标详情、监督用户详情页面中的手写 SVG 图表，包括趋势折线图、维度雷达图、环形进度图、日历热力图。

## 实施步骤

### 步骤 1：调研现有手写 SVG 图表

先读取以下页面，了解手写 SVG 图表的数据结构、样式和交互：
- `src/app/(main)/page.tsx` — 仪表盘（趋势图、雷达图等）
- `src/app/(main)/goal-detail/page.tsx` — 目标详情（进度图）
- `src/app/(main)/supervise-user-detail/page.tsx` — 被监督用户详情（数据图表）

记录每个 SVG 图表对应的数据类型、布局尺寸、配色方案。

### 步骤 2：创建图表组件目录

创建 `src/components/charts/` 目录，包含以下文件：

```
src/components/charts/
├── trend-chart.tsx       # 趋势折线图（AreaChart）
├── radar-chart.tsx       # 维度雷达图（RadarChart）
├── progress-ring.tsx      # 环形进度（PieChart / 自定义）
├── heatmap.tsx            # 日历热力图（自定义实现）
└── chart-theme.ts         # 图表主题配置（配色、样式常量）
```

### 步骤 3：实现图表组件

#### trend-chart.tsx — 趋势折线图

使用 Recharts 的 `<AreaChart>` 组件，支持：
- 多维度数据折线（如：心情、专注度、效率等）
- 毛玻璃风配色（主色 #7C5CFF，强调色 #69E7FF）
- 响应式宽度（使用 `ResponsiveContainer`）
- 自定义 Tooltip 样式（毛玻璃背景）
- 平滑曲线（`type="monotone"`）

```tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  dataKeys: string[];
  xAxisKey?: string;
  colors?: string[];
}

export function TrendChart({
  data,
  dataKeys,
  xAxisKey = "date",
  colors = ["#7C5CFF", "#69E7FF", "#FF6B9D"],
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((key, idx) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey={xAxisKey}
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(13, 17, 36, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: "#fff",
          }}
        />
        {dataKeys.map((key, idx) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[idx % colors.length]}
            fill={`url(#gradient-${key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

#### radar-chart.tsx — 维度雷达图

使用 Recharts 的 `<RadarChart>` 组件，支持：
- 多维度评估（如：学习、工作、健康、社交、情绪、创造力）
- 半透明填充区域
- 多边形网格线
- 自定义标签样式

#### progress-ring.tsx — 环形进度

使用 Recharts 的 `<PieChart>` 组件实现环形进度，支持：
- 百分比显示
- 渐变进度条
- 中心文字（如 "75%"）
- 多色段（如不同目标的不同进度）

#### heatmap.tsx — 日历热力图

自定义实现（Recharts 无内置日历热力图），基于 SVG 绘制：
- 7 列（周一至周日）× N 行（周数）
- 颜色深浅表示数据密度
- 毛玻璃风配色
- 支持 tooltip 显示具体日期和数据

### 步骤 4：替换页面中的手写 SVG

按以下顺序替换：

1. **仪表盘 `src/app/(main)/page.tsx`**：替换趋势图、雷达图为 `<TrendChart>` 和 `<RadarChart>`
2. **目标详情 `src/app/(main)/goal-detail/page.tsx`**：替换进度图为 `<ProgressRing>`
3. **监督用户详情 `src/app/(main)/supervise-user-detail/page.tsx`**：替换数据图表

### 步骤 5：创建图表主题配置

```tsx
// src/components/charts/chart-theme.ts
export const CHART_COLORS = {
  primary: "#7C5CFF",
  accent: "#69E7FF",
  rose: "#FF6B9D",
  amber: "#FFB86C",
  emerald: "#50FA7B",
  slate: "#94A3B8",
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(13, 17, 36, 0.9)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#fff",
};

export const CHART_GRID_STYLE = {
  stroke: "rgba(255,255,255,0.05)",
  strokeDasharray: "3 3",
};

export const CHART_AXIS_STYLE = {
  stroke: "rgba(255,255,255,0.3)",
  tick: { fontSize: 12, fill: "rgba(255,255,255,0.5)" },
};
```

## 代码示例

### 仪表盘趋势图替换

```tsx
// 替换前（手写 SVG）
<div className="h-64">
  <svg viewBox="0 0 600 200" className="w-full h-full">
    {/* 大量手写 path、circle、line 元素 */}
    <path d="M10,150 L90,100 L170,130..." stroke="#7C5CFF" fill="none" />
    <circle cx="90" cy="100" r="4" fill="#7C5CFF" />
    {/* ... */}
  </svg>
</div>

// 替换后（Recharts）
<div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
  <h3 className="text-white text-lg font-semibold mb-4">趋势概览</h3>
  <TrendChart
    data={trendData}
    dataKeys={["mood", "focus", "efficiency"]}
  />
</div>
```

## 验收标准

- [ ] `src/components/charts/` 目录已创建，包含 4 个图表组件 + 1 个主题配置
- [ ] `trend-chart.tsx` 支持多维度折线、响应式、毛玻璃风 Tooltip
- [ ] `radar-chart.tsx` 支持多维度雷达图、透明填充、毛玻璃风标签
- [ ] `progress-ring.tsx` 支持环形进度、百分比显示、中心文字
- [ ] `heatmap.tsx` 支持日历热力图、颜色深度映射、Tooltip
- [ ] 仪表盘页面中的手写 SVG 已替换为对应图表组件
- [ ] 目标详情页面中的进度 SVG 已替换为 `<ProgressRing>`
- [ ] 监督用户详情页面中的图表 SVG 已替换
- [ ] 所有图表组件在无数据时展示空态提示
- [ ] 所有图表保持毛玻璃风配色（主色 #7C5CFF，强调色 #69E7FF）
- [ ] 通过 `pnpm typecheck` 类型检查
- [ ] 通过 `pnpm lint` 代码规范检查
- [ ] 通过 `pnpm build` 构建成功

## 预估工时

2 人天

## 依赖

无（可与其他 P2 任务并行执行）