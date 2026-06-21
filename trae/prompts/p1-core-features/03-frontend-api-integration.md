# P1-03：前端 API 接入

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

**页面文件（需读取了解当前状态）**：
- `src/app/(main)/page.tsx` — 仪表盘首页（**当前使用 Mock 数据**）
- `src/app/(main)/records/page.tsx` — 记录列表（**已接入 API**）
- `src/app/(main)/record-form/page.tsx` — 新增记录（**已接入 API**）
- `src/app/(main)/record-detail/page.tsx` — 记录详情（**已接入 API**）
- `src/app/(main)/goals/page.tsx` — 目标列表（**已接入 API**）
- `src/app/(main)/goal-detail/page.tsx` — 目标详情（**当前使用 Mock 数据**）
- `src/app/(main)/analysis/page.tsx` — 智能分析（**已接入 SSE**）
- `src/app/(main)/gateway/page.tsx` — 网关管理台（**当前使用静态占位数据**）
- `src/app/(main)/supervise/page.tsx` — 监督面板（**已接入 API**）

**认证上下文**：
- `src/components/auth/auth-provider.tsx` — 提供 `useAuth()` Hook，返回 `{ session, profile, isLoading }`

## 任务目标

将项目中仍使用 Mock 数据的页面接入真实 API 调用，并创建通用数据获取 Hook，统一 loading/error/empty 状态处理。

## 实施步骤

### 步骤 1：创建通用数据获取 Hook

**目标文件**：`src/hooks/use-api.ts`

创建 `useFetch` 和 `useMutation` 两个通用 Hook：

```typescript
// useFetch — 用于 GET 请求的自动获取
function useFetch<T>(url: string, options?: { enabled?: boolean }): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// useMutation — 用于 POST/PUT/DELETE 请求
function useMutation<T, V = unknown>(url: string, method: "POST" | "PUT" | "DELETE"): {
  mutate: (body?: V) => Promise<{ success: boolean; data?: T; error?: string }>;
  loading: boolean;
  error: string | null;
}
```

**实现细节**：
- 使用 `useAuth()` 获取 `session.access_token` 作为 `x-session` 请求头
- `useFetch` 中 `url` 变化时自动重新获取
- `enabled` 参数控制是否自动获取（默认 `true`）
- 统一错误处理：网络错误、API 错误、JSON 解析错误

### 步骤 2：改造仪表盘首页 `src/app/(main)/page.tsx`

**当前状态**：使用 Mock 数据
- `todayCards` — 四个维度的硬编码数据
- `goals` — 三个硬编码目标
- SVG 趋势图 — 硬编码坐标点
- 热力图 — 硬编码活跃度

**改造方案**：
1. 使用 `useFetch` 获取最近记录数据：`GET /api/records?limit=30`
2. 使用 `useFetch` 获取活跃目标：`GET /api/goals`
3. 从真实数据中计算今日各维度汇总
4. 从 mood_score 数据生成真实的趋势图数据
5. 从记录日期分布生成真实的热力图数据
6. 添加 loading/error/empty 三种状态处理

**数据计算逻辑**：

```typescript
// 计算今日各维度汇总
function calculateTodayCards(records: RecordItem[]) {
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter(r => r.recordDate === today);
  
  const cards = [];
  for (const dim of ["learning", "work", "health", "mood"]) {
    const dimRecords = todayRecords.filter(r => {
      const d = r[dim as keyof RecordItem];
      return d && typeof d === "object" && Object.keys(d as object).length > 0;
    });
    // 根据维度类型计算汇总值
    // ...
  }
  return cards;
}
```

### 步骤 3：改造目标详情页 `src/app/(main)/goal-detail/page.tsx`

**当前状态**：完全使用 Mock 数据
- `goal` 对象 — 硬编码
- `trendData` — 硬编码
- `relatedRecords` — 硬编码

**改造方案**：
1. 从 URL 参数 `goal_id` 获取目标 ID
2. 使用 `useFetch` 获取目标详情：`GET /api/goals/${goalId}`
3. 使用 `useFetch` 获取关联记录：`GET /api/records?goalId=${goalId}`
4. 从关联记录中提取进度趋势数据
5. 添加 loading/error/empty 状态处理

### 步骤 4：改造网关管理台 `src/app/(main)/gateway/page.tsx`

**当前状态**：使用静态占位数据
- 总调用次数：`"—"`
- 总 Token 消耗：`"—"`
- 总成本：`"—"`
- 调用明细：`"暂无调用记录"`

**改造方案**：
1. 使用 `useFetch` 获取网关统计数据：`GET /api/gateway/stats?timeRange=${timeRange}`
2. 注意：当前 `/api/gateway/route.ts` 的 GET 只返回状态信息，需要确认是否有统计端点
3. 如果无统计 API，需要先在 `src/app/api/gateway/route.ts` 中添加统计查询逻辑
4. 调用明细表从 `gateway_usage_log` 表查询

### 步骤 5：统一状态处理模式

所有改造后的页面需要使用统一的状态处理模式：

```tsx
// Loading 状态
if (loading) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Error 状态
if (error) {
  return (
    <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-12 text-center">
      <p className="text-destructive mb-2">加载失败</p>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <button onClick={refetch} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
        重试
      </button>
    </div>
  );
}

// Empty 状态
if (!data || data.length === 0) {
  return (
    <div className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-12 text-center">
      <p className="text-muted-foreground mb-4">暂无数据</p>
      <Link href="/record-form" className="...">新增记录</Link>
    </div>
  );
}
```

## 代码示例

### `src/hooks/use-api.ts` 完整实现

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  enabled?: boolean;
}

/**
 * 通用 GET 请求 Hook
 * 自动从 useAuth 获取 session token 并附加到请求头
 */
export function useFetch<T = unknown>(
  url: string,
  options: UseFetchOptions = {}
): FetchState<T> & { refetch: () => void } {
  const { session } = useAuth();
  const { enabled = true } = options;
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !enabled) return;

    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(url, {
        headers: { "x-session": session.access_token },
        signal: controller.signal,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `请求失败 (${res.status})`);
      }

      setState({ data: json.data as T, loading: false, error: null });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({
        data: null,
        loading: false,
        error: (err as Error).message || "网络请求失败",
      });
    }
  }, [url, session?.access_token, enabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

interface MutationState<T> {
  loading: boolean;
  error: string | null;
}

/**
 * 通用 POST/PUT/DELETE 请求 Hook
 * 手动调用 mutate 触发请求
 */
export function useMutation<T = unknown, V = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST"
): {
  mutate: (body?: V) => Promise<{ success: boolean; data?: T; error?: string }>;
  loading: boolean;
  error: string | null;
} {
  const { session } = useAuth();
  const [state, setState] = useState<MutationState<T>>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (body?: V): Promise<{ success: boolean; data?: T; error?: string }> => {
      if (!session?.access_token) {
        return { success: false, error: "未登录" };
      }

      setState({ loading: true, error: null });

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-session": session.access_token,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json();
        setState({ loading: false, error: json.success ? null : json.error });

        return json;
      } catch (err) {
        const error = (err as Error).message || "网络请求失败";
        setState({ loading: false, error });
        return { success: false, error };
      }
    },
    [url, method, session?.access_token]
  );

  return { ...state, mutate };
}
```

### 仪表盘改造后的数据获取

```typescript
// 在 page.tsx 中
const { data: records, loading: recordsLoading } = useFetch<RecordItem[]>("/api/records?limit=30");
const { data: goals, loading: goalsLoading } = useFetch<GoalItem[]>("/api/goals");

const loading = recordsLoading || goalsLoading;

// 从真实数据计算今日卡片
const todayCards = useMemo(() => {
  if (!records) return [];
  return calculateTodayCards(records);
}, [records]);

// 从真实数据生成趋势图
const moodTrend = useMemo(() => {
  if (!records) return [];
  return records
    .filter(r => r.moodScore != null)
    .sort((a, b) => a.recordDate.localeCompare(b.recordDate))
    .slice(-7)
    .map(r => ({ date: r.recordDate.slice(5), value: r.moodScore! }));
}, [records]);
```

## 验收标准

- [ ] `src/hooks/use-api.ts` 文件已创建，useFetch 和 useMutation 正常工作
- [ ] 仪表盘首页 `page.tsx` 已接入真实 API，无 Mock 数据
- [ ] 目标详情页 `goal-detail/page.tsx` 已接入真实 API，无 Mock 数据
- [ ] 网关管理台 `gateway/page.tsx` 已接入真实 API，显示真实统计数据
- [ ] 所有页面均包含 loading/error/empty 三种状态处理
- [ ] 毛玻璃风设计保持不变
- [ ] 无 TypeScript 类型错误

## 预估工时

2 人天

## 依赖

无