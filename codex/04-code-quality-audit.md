# GrowthMind 代码质量审计

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、审计指标

| 指标 | 当前状态 | 目标 |
|------|----------|------|
| TypeScript 类型安全 | ⚠️ 有类型错误 | 零错误 |
| ESLint 合规 | ⚠️ 未验证 | 零警告 |
| 组件复用率 | ❌ 极低 | 高（使用 shadcn/ui） |
| 代码重复 | ⚠️ 中等 | 低 |
| 测试覆盖 | ❌ 0% | > 60% |
| 文件组织 | ✅ 良好 | — |

## 二、TypeScript 问题

### 2.1 类型导入冲突

**文件**：`src/storage/database/supabase-client.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// 后续又定义了同名函数 createClient()
```

**状态**：residual-issues.md 标记为"已修复"，但当前代码仍存在此导入。

### 2.2 Supabase Client 类型推断

**文件**：所有使用 `getSupabaseClient()` 的 API routes

```typescript
const db = getSupabaseClient();
const { data } = await db.from("records").select("*");
// TS 可能报错：Property 'select' does not exist
```

**原因**：`getSupabaseClient()` 返回 `SupabaseClient` 泛型类型，缺少 Database 类型参数。

**修复建议**：
```typescript
import type { Database } from '@/types/supabase';

function getSupabaseClient(token?: string): SupabaseClient<Database> {
  // ...
}
```

### 2.3 Drizzle relations.ts 空文件

**文件**：`src/storage/database/shared/relations.ts`

```typescript
import { relations } from "drizzle-orm/relations";
import { } from "./schema"; // 空导入
```

**问题**：空文件应删除或补充完整的表关联定义。

### 2.4 缺少类型定义文件

**问题**：无 `src/types/` 目录，接口定义散落在各组件中。

**建议**：创建统一的类型定义：
```
src/types/
├── database.ts    — Supabase 生成的 Database 类型
├── api.ts         — API 请求/响应类型
├── models.ts      — 业务模型类型
└── index.ts       — 统一导出
```

## 三、React / Next.js 问题

### 3.1 根页面未重定向

**文件**：`src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <div>
      <h1>应用开发中</h1>
      <p>请稍后，页面即将呈现</p>
    </div>
  );
}
```

**问题**：根页面显示扣子编程的默认模板，应重定向到 `/login` 或仪表盘。

### 3.2 全部页面标记 'use client'

**问题**：所有页面组件都是客户端组件（`"use client"`），包括不需要客户端交互的页面。

**影响**：
- 增加客户端 bundle 大小
- 失去 SSR 的 SEO 和首屏性能优势
- 无法使用 Server Components 的数据获取优化

**建议**：纯展示页面（如 record-detail、goal-detail）可以改为 Server Components。

### 3.3 内联 SVG 图表

**文件**：`src/app/(main)/page.tsx`、`goal-detail/page.tsx`、`supervise-user-detail/page.tsx`

**问题**：图表使用手写 SVG 内联在组件中，代码冗长且不可复用。

```tsx
<svg viewBox="0 0 600 160" className="w-full h-full">
  <defs>...</defs>
  {/* 100+ 行 SVG 代码 */}
</svg>
```

**建议**：
1. 已安装 `recharts`，应使用它替代手写 SVG
2. 将图表抽取为独立组件：`<TrendChart />`、`<RadarChart />`、`<ProgressRing />`

### 3.4 Mock 数据硬编码

**位置**：几乎所有页面组件

```typescript
const mockRecords = [
  { id: "rec_001", timeDimension: "日报", ... },
  // 10+ 条硬编码数据
];
```

**影响**：
- 页面与真实数据脱节
- 增加代码体积
- 数据不一致（不同页面的 Mock 数据可能不同步）

**建议**：创建 `src/mocks/` 目录统一管理，或更好的方案是直接接入 API。

### 3.5 组件文件过大

| 文件 | 行数 | 建议 |
|------|------|------|
| `record-form/page.tsx` | ~400 行 | 拆分为子组件 |
| `supervise-rules/page.tsx` | ~300 行 | 拆分规则卡片+表单 |
| `supervise/page.tsx` | ~280 行 | 拆分用户卡片+统计 |
| `gateway/page.tsx` | ~270 行 | 拆分图表+表格 |
| `login/page.tsx` | ~250 行 | 可接受 |

## 四、样式问题

### 4.1 未使用 shadcn/ui 组件

**现状**：安装了 60+ shadcn/ui 组件，但页面中全部手写。

**示例对比**：

```tsx
// ❌ 当前：手写按钮
<button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-float hover:shadow-glow transition-all">
  保存
</button>

// ✅ 应使用
import { Button } from "@/components/ui/button";
<Button className="bg-gradient-to-r from-primary to-accent">保存</Button>
```

### 4.2 样式类名重复

**问题**：以下类名组合在多个页面重复出现：

```css
bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4
hover:bg-surface/60 hover:border-primary/30 transition-all duration-300
```

**建议**：提取为 CSS 工具类或组件：
```css
/* globals.css */
@utility glass-card {
  @apply bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl;
}
```

### 4.3 自定义 CSS 变量与 shadcn 变量重复

**问题**：`globals.css` 中同时定义了 `@theme inline` 和 `:root` 两套变量，内容完全相同。

```css
@theme inline {
  --color-primary: #7C5CFF;
}
:root {
  --primary: #7C5CFF;  // 重复
}
```

**建议**：Tailwind CSS v4 使用 `@theme` 即可，`:root` 变量可移除（除非有运行时切换主题的需求）。

## 五、代码组织问题

### 5.1 目录结构不一致

**问题**：
- 数据库相关代码在 `src/storage/database/`，但 Drizzle ORM 未被使用
- API routes 在 `src/app/api/`，符合 Next.js 规范
- 缺少 `src/services/` 或 `src/lib/` 用于业务逻辑层

**建议**：
```
src/
├── app/api/          — API routes（薄层，只做路由）
├── services/         — 业务逻辑层
│   ├── records.ts
│   ├── goals.ts
│   ├── analysis.ts
│   └── gateway.ts
├── lib/              — 工具函数
├── storage/          — 数据库访问层
└── types/            — 类型定义
```

### 5.2 缺少常量定义

**问题**：魔法字符串散落在代码中。

```typescript
// 多处出现
timeDimension === "日报"  // 应使用枚举
role === "admin"           // 应使用常量
status === "active"        // 应使用常量
```

### 5.3 缺少错误边界

**问题**：无 `error.tsx` 或 `not-found.tsx` 文件。API 错误或页面异常时用户看到白屏。

**建议**：
```
src/app/
├── error.tsx          — 全局错误边界
├── not-found.tsx      — 404 页面
├── (main)/
│   ├── error.tsx      — 主区域错误边界
│   └── loading.tsx    — 主区域加载态
```

## 六、正面评价 ✅

- **文件命名规范**：统一使用 kebab-case
- **导入路径别名**：`@/` 路径别名配置正确
- **TypeScript 使用**：无 `any` 类型滥用（除一处 `catch`）
- **组件导出方式**：统一使用 `export default function`
- **CSS 变量命名**：遵循 shadcn/ui 规范
- **响应式设计**：所有页面支持移动端（`lg:` 断点）

## 七、代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 类型安全 | 6/10 | 有 TS 错误，缺少类型定义文件 |
| 组件设计 | 5/10 | 未使用组件库，文件过大 |
| 代码复用 | 4/10 | 大量重复样式和 Mock 数据 |
| 错误处理 | 3/10 | 无错误边界，catch 块空 |
| 测试覆盖 | 0/10 | 无测试 |
| 文件组织 | 7/10 | 目录结构清晰，但缺少分层 |
| **综合** | **4.2/10** | |
