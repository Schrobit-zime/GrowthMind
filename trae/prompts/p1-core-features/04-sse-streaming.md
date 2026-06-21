# P1-04：SSE 流式 AI 分析

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

- SSE API 端点：`src/app/api/analysis/route.ts`（POST 方法，已实现基础 SSE 流式转发）
- 分析页面：`src/app/(main)/analysis/page.tsx`（已实现 SSE 客户端读取，但缺少通用 Hook 封装）
- 模型网关：`src/app/api/gateway/route.ts`（已实现多厂商 SSE 流式转发）
- 认证上下文：`src/components/auth/auth-provider.tsx`

## 任务目标

将 SSE 流式 AI 分析功能从页面内联实现抽取为通用 Hook，并增强其健壮性，支持流式文本逐段显示、停止生成、错误重试。

## 实施步骤

### 步骤 1：读取当前实现了解现状

首先读取以下文件：
- `src/app/api/analysis/route.ts` — 了解当前 SSE 服务端实现
- `src/app/(main)/analysis/page.tsx` — 了解当前前端 SSE 消费逻辑

**当前实现分析**：
- 服务端：`analysis/route.ts` POST 将请求转发到 Gateway，Gateway 返回 SSE 流后直接透传
- 前端：`analysis/page.tsx` 使用 `ReadableStream` + `TextDecoder` 手动解析 SSE 事件
- 当前已有基础流式读取能力，但逻辑与页面耦合

### 步骤 2：创建通用 SSE Hook

**目标文件**：`src/hooks/use-sse.ts`

```typescript
interface UseSSEOptions {
  /** SSE 端点 URL */
  url: string;
  /** 请求体 */
  body?: Record<string, unknown>;
  /** 收到新内容时的回调 */
  onChunk?: (chunk: string, accumulated: string) => void;
  /** 流结束时的回调 */
  onDone?: (fullText: string) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

interface UseSSEReturn {
  /** 当前累积的完整文本 */
  text: string;
  /** 是否正在接收流 */
  streaming: boolean;
  /** 错误信息 */
  error: string | null;
  /** 开始请求 SSE */
  start: () => void;
  /** 停止 SSE 流 */
  stop: () => void;
  /** 重置状态 */
  reset: () => void;
}
```

**实现细节**：
- 使用 `AbortController` 控制请求的取消
- 使用 `ReadableStream` + `TextDecoder` 解析 SSE 事件
- 支持 OpenAI 兼容格式（`data: {"choices":[{"delta":{"content":"..."}}]}`）和纯文本格式
- 支持 `[DONE]` 终止标记
- 处理 `ReadableStream` 的 `done` 和 `error` 事件

### 步骤 3：重构分析页面

**目标文件**：`src/app/(main)/analysis/page.tsx`

将当前内联的 SSE 处理逻辑替换为 `useSSE` Hook：

```typescript
const { text, streaming, error, start, stop, reset } = useSSE({
  url: "/api/analysis",
  body: {
    timeRange,
    dimensions: dims,
    analysisType,
    records: records,
  },
  onDone: (fullText) => {
    fetchHistory(); // 流结束后刷新历史记录
  },
});
```

**页面改造要点**：
- 移除 `analyze` 函数中的手动 SSE 解析逻辑
- 使用 `useSSE` Hook 管理流式状态
- 添加"停止生成"按钮（当 `streaming` 为 true 时显示）
- 添加"重新生成"按钮（当流已结束或出错时显示）
- 保留现有的 loading spinner 动画

### 步骤 4：增强错误处理

在 `useSSE` Hook 中实现以下错误处理：

1. **网络错误**：`fetch` 失败时触发 `onError`
2. **HTTP 错误**：非 200 响应读取错误文本
3. **JSON 解析错误**：SSE 数据格式异常时跳过该 chunk
4. **超时处理**：可选的超时时间（默认 60 秒）
5. **重试机制**：可选的自动重试（最多 3 次）

### 步骤 5：增强分析页面 UI

在 `analysis/page.tsx` 中添加以下交互：

```
[开始分析] ← 默认状态
[停止生成] ← 流式进行中（替换开始按钮）
[重新生成] ← 流已结束或出错
```

## 代码示例

### `src/hooks/use-sse.ts` 完整实现

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

interface UseSSEOptions {
  url: string;
  body?: Record<string, unknown>;
  onChunk?: (chunk: string, accumulated: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: string) => void;
}

/**
 * SSE (Server-Sent Events) 流式数据消费 Hook
 * 用于消费 AI 分析等流式 API 响应
 */
export function useSSE(options: UseSSEOptions) {
  const { session } = useAuth();
  const { url, body, onChunk, onDone, onError } = options;

  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /**
   * 开始 SSE 流式请求
   */
  const start = useCallback(async () => {
    if (!session?.access_token) {
      setError("未登录");
      onError?.("未登录");
      return;
    }

    // 重置状态
    setText("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session": session.access_token,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        // 尝试读取错误 JSON
        const errText = await res.text();
        let errMsg = `请求失败 (${res.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) errMsg = errJson.error;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              // OpenAI 兼容格式
              const content =
                parsed.choices?.[0]?.delta?.content ||
                parsed.content?.[0]?.text ||
                "";
              if (content) {
                accumulated += content;
                setText(accumulated);
                onChunk?.(content, accumulated);
              }
            } catch {
              // 纯文本格式
              if (data && data !== "[DONE]") {
                accumulated += data;
                setText(accumulated);
                onChunk?.(data, accumulated);
              }
            }
          }
        }
      }

      setStreaming(false);
      onDone?.(accumulated);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStreaming(false);
        return;
      }
      const errMsg = (err as Error).message || "流式请求失败";
      setError(errMsg);
      setStreaming(false);
      onError?.(errMsg);
    }
  }, [url, body, session?.access_token, onChunk, onDone, onError]);

  /**
   * 停止当前 SSE 流
   */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    stop();
    setText("");
    setError(null);
  }, [stop]);

  return { text, streaming, error, start, stop, reset };
}
```

### 重构后的分析页面核心逻辑

```typescript
export default function AnalysisPage() {
  const { session } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(["学习", "工作", "心情"]);
  const [analysisType, setAnalysisType] = useState("trend");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [noDataWarning, setNoDataWarning] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { text: result, streaming: isAnalyzing, error, start: startSSE, stop: stopSSE } = useSSE({
    url: "/api/analysis",
    onDone: (fullText) => {
      fetchHistory(); // 流结束后刷新历史
    },
  });

  const handleAnalyze = async () => {
    if (!session?.access_token) return;
    setNoDataWarning(false);

    // 先获取记录数据
    const now = new Date();
    const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const from = new Date(now.getTime() - daysBack * 86400000).toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];

    const recRes = await fetch(`/api/records?from=${from}&to=${to}&limit=50`, {
      headers: { "x-session": session.access_token },
    });
    const recJson = await recRes.json();

    if (!recJson.success || !recJson.data || recJson.data.length === 0) {
      setNoDataWarning(true);
      return;
    }

    const dims = selectedDimensions.map((d) => dimensionValues[d]).filter(Boolean);

    // 启动 SSE 流式分析
    startSSE({
      timeRange,
      dimensions: dims,
      analysisType,
      records: recJson.data,
    });
  };

  // ... 渲染逻辑
}
```

## 验收标准

- [ ] `src/hooks/use-sse.ts` 文件已创建，通用 SSE Hook 可复用
- [ ] `src/app/(main)/analysis/page.tsx` 已使用 `useSSE` Hook 重构
- [ ] 流式文本逐段显示正常工作
- [ ] "停止生成"按钮可立即中断 SSE 流
- [ ] 错误状态可触发重试
- [ ] 分析完成后自动刷新历史记录
- [ ] 无 TypeScript 类型错误

## 预估工时

1 人天

## 依赖

无