# P2-05: Server Components 改造

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

将纯展示类页面改造为 Next.js Server Components，让数据获取在服务端完成，减少客户端 JavaScript 体积，提升首屏加载性能。

## 实施步骤

### 步骤 1：调研当前页面实现

先读取以下页面，了解当前实现方式（是否使用 `'use client'`、有哪些 hooks、数据获取方式）：

**纯展示页面（优先改造）：**
- `src/app/(main)/record-detail/page.tsx` — 记录详情（纯展示）
- `src/app/(main)/goal-detail/page.tsx` — 目标详情（纯展示）

**半展示页面（评估改造可行性）：**
- `src/app/(main)/gateway/page.tsx` — 模型网关（主要是数据展示 + 少量交互）
- `src/app/(main)/analysis/page.tsx` — 智能分析（展示 + 可能有的交互）

**评估维度：**
- 是否使用 `'use client'` 指令？
- 使用了哪些客户端 hooks（useState、useEffect、useAuth 等）？
- 数据获取是在客户端还是服务端？
- 页面中有哪些交互（按钮点击、表单、弹窗等）？

### 步骤 2：改造纯展示页面

#### record-detail/page.tsx 改造

将数据获取从客户端改为服务端：

```tsx
// 改造前（Client Component）
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function RecordDetailPage() {
  const params = useParams();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/records/${params.id}`)
      .then(res => res.json())
      .then(setRecord)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) return <div>加载中...</div>;
  // ...
}

// 改造后（Server Component）
// 注意：移除 'use client' 指令
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RecordDetailClient } from "./record-detail-client";

interface RecordDetailPageProps {
  params: Promise<{ id: string }>;
}

// 服务端数据获取
async function getRecord(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { id } = await params;
  const record = await getRecord(id);

  if (!record) {
    notFound();
  }

  // 将纯展示部分留在服务端，交互部分抽取为 Client Component
  return (
    <div className="space-y-6">
      {/* 服务端渲染的纯展示内容 */}
      <div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">{record.title}</h1>
        <p className="text-gray-400">{record.description}</p>
        {/* ... */}
      </div>

      {/* 交互部分：分享按钮、编辑按钮等 */}
      <RecordDetailClient recordId={id} />
    </div>
  );
}
```

#### 抽取客户端交互组件

```tsx
// src/app/(main)/record-detail/record-detail-client.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Share2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RecordDetailClientProps {
  recordId: string;
}

export function RecordDetailClient({ recordId }: RecordDetailClientProps) {
  const router = useRouter();

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: "分享记录",
        url: window.location.href,
      });
    } catch {
      // 降级方案：复制链接
      await navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制到剪贴板");
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => router.push(`/record-form?id=${recordId}`)}
        className="backdrop-blur-md bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 text-white gap-2"
      >
        <Pencil className="w-4 h-4" />
        编辑
      </Button>
      <Button
        onClick={handleShare}
        variant="outline"
        className="backdrop-blur-md bg-white/5 border-white/10 text-white gap-2"
      >
        <Share2 className="w-4 h-4" />
        分享
      </Button>
    </div>
  );
}
```

### 步骤 3：改造 goal-detail/page.tsx

与 record-detail 类似的改造模式：

1. 移除 `'use client'` 指令
2. 将数据获取函数改为 async 函数，使用 Supabase 服务端客户端
3. 将交互部分（按钮点击、表单提交等）抽取为独立的 Client Component
4. 保留纯展示内容在 Server Component 中

```tsx
// src/app/(main)/goal-detail/page.tsx（Server Component 改造后）
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { GoalDetailClient } from "./goal-detail-client";

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getGoal(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = await params;
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">{goal.title}</h1>
        <p className="text-gray-400 mb-4">{goal.description}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            截止日期: {new Date(goal.deadline).toLocaleDateString("zh-CN")}
          </span>
          <span
            className={`text-sm px-2 py-0.5 rounded-full ${
              goal.status === "completed"
                ? "bg-emerald-500/10 text-emerald-400"
                : goal.status === "expired"
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-[#7C5CFF]/10 text-[#7C5CFF]"
            }`}
          >
            {goal.status === "completed" ? "已完成" : goal.status === "expired" ? "已过期" : "进行中"}
          </span>
        </div>
      </div>

      <GoalDetailClient goalId={id} />
    </div>
  );
}
```

### 步骤 4：评估 gateway/page.tsx 改造

`gateway/page.tsx` 主要展示模型网关配置，交互较少（可能只有开关切换）。

改造策略：
- 如果交互极少（仅 1-2 个按钮）：将交互部分抽取为 `<GatewayClient>` 组件
- 如果交互较多：保持为 Client Component，不强制改造

### 步骤 5：创建服务端数据获取工具函数

在 `src/lib/` 下创建统一的服务端数据获取函数：

```tsx
// src/lib/data/records.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getRecordById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch record:", error);
    return null;
  }
  return data;
}

export async function getRecordsByUserId(userId: string, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch records:", error);
    return [];
  }
  return data;
}
```

```tsx
// src/lib/data/goals.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getGoalById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch goal:", error);
    return null;
  }
  return data;
}

export async function getGoalsByUserId(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch goals:", error);
    return [];
  }
  return data;
}
```

### 步骤 6：改造原则总结

| 判断标准 | 改造策略 |
|---------|---------|
| 纯展示，无 hooks，无事件 | 直接移除 `'use client'`，改为 Server Component |
| 展示为主，有少量交互（按钮、分享等） | 主体改为 Server Component，交互部分抽取为 Client Component |
| 交互密集（表单、图表、实时更新等） | 保持 Client Component，不强制改造 |
| 使用 `useAuth` 等认证 hooks | 使用 `createServerSupabaseClient` 在服务端获取用户 |

## 代码示例

### Server Component 数据获取模式

```tsx
// 标准的 Server Component 数据获取模式
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// 动态 metadata（SEO 优化）
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const record = await getRecordById(id);
  return {
    title: record ? `${record.title} - GrowthMind` : "未找到",
    description: record?.description?.slice(0, 160),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 并行获取关联数据
  const [record] = await Promise.all([
    getRecordById(id),
  ]);

  if (!record) {
    notFound();
  }

  return (
    <div>
      {/* 服务端渲染内容 */}
      <h1>{record.title}</h1>
      <p>{record.description}</p>

      {/* 客户端交互组件 */}
      <ClientActions recordId={id} />
    </div>
  );
}
```

## 验收标准

- [ ] `src/app/(main)/record-detail/page.tsx` 已改造为 Server Component
- [ ] `src/app/(main)/goal-detail/page.tsx` 已改造为 Server Component
- [ ] 改造后的页面移除了 `'use client'` 指令
- [ ] 数据获取逻辑改为服务端 async/await（使用 `createServerSupabaseClient`）
- [ ] 客户端交互部分（按钮、分享等）已抽取为独立的 Client Component
- [ ] `src/lib/data/records.ts` 已创建，包含服务端数据获取函数
- [ ] `src/lib/data/goals.ts` 已创建，包含服务端数据获取函数
- [ ] 改造后的页面在数据不存在时调用 `notFound()`
- [ ] 改造后的页面添加了 `generateMetadata` 动态 SEO 元数据
- [ ] `gateway/page.tsx` 已评估并完成改造（如适用）
- [ ] 所有改造后的页面保持毛玻璃风设计风格
- [ ] 所有改造后的页面功能与改造前一致
- [ ] 通过 `pnpm typecheck` 类型检查
- [ ] 通过 `pnpm lint` 代码规范检查
- [ ] 通过 `pnpm build` 构建成功

## 预估工时

1.5 人天

## 依赖

无（可与其他 P2 任务并行执行）