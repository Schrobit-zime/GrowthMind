# GrowthMind 优化建议

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、优先级分类

- **P0**：阻塞上线，必须立即修复
- **P1**：影响核心功能，应在下一迭代完成
- **P2**：提升体验，可安排在后续版本
- **P3**：锦上添花，低优先级

---

## 二、P0 — 上线阻塞项

### 2.1 实现 API 鉴权中间件

**目标**：所有 API routes 必须验证用户身份

**方案**：创建可复用的鉴权辅助函数

```typescript
// src/lib/api-auth.ts
export async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get("x-session");
  if (!token) return null;
  
  const db = getSupabaseClient(token);
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  
  return { user, db };
}

// 在 API route 中使用
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }
  // 使用 auth.db 进行查询（自动应用 RLS）
}
```

### 2.2 实现中间件角色守卫

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('sb-access-token');
  
  // 受保护路由
  const protectedRoutes = ['/supervise', '/gateway'];
  const isProtected = protectedRoutes.some(r => 
    request.nextUrl.pathname.startsWith(r)
  );
  
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Admin 路由检查
  const adminRoutes = ['/supervise', '/gateway'];
  const isAdminRoute = adminRoutes.some(r => 
    request.nextUrl.pathname.startsWith(r)
  );
  
  if (isAdminRoute) {
    // 验证 role（通过 cookie 或快速 DB 查询）
  }
  
  return NextResponse.next();
}
```

### 2.3 配置 Supabase RLS

```sql
-- records 表 RLS 策略
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON records
  FOR DELETE USING (auth.uid() = user_id);

-- Admin 可查看所有记录
CREATE POLICY "Admins can view all records" ON records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

---

## 三、P1 — 核心功能完善

### 3.1 统一数据库访问层为 Drizzle ORM

**理由**：类型安全、SQL-like API、更好的开发体验

```typescript
// src/lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/storage/database/shared/schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

// API route 中使用
import { db } from '@/lib/db';
import { records } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const data = await db.select().from(records)
    .where(eq(records.userId, auth.user.id))
    .orderBy(desc(records.createdAt));
  return NextResponse.json({ success: true, data });
}
```

### 3.2 前端接入真实 API

**影响文件**（共 8 个页面需要改造）：

| 页面 | 当前状态 | 改造内容 |
|------|----------|----------|
| `records/page.tsx` | Mock 数据 | 调用 GET /api/records |
| `record-form/page.tsx` | 无保存 | 调用 POST /api/records |
| `record-detail/page.tsx` | Mock 数据 | 调用 GET /api/records/[id] |
| `goals/page.tsx` | Mock 数据 | 调用 GET /api/goals |
| `goal-detail/page.tsx` | Mock 数据 | 调用 GET /api/goals/[id] |
| `analysis/page.tsx` | setTimeout 模拟 | 调用 POST /api/analysis + SSE |
| `gateway/page.tsx` | Mock 数据 | 调用 GET /api/gateway |
| `supervise/page.tsx` | Mock 数据 | 调用 GET /api/supervise |

### 3.3 实现缺失的 API Routes

```
src/app/api/
├── supervise/
│   ├── route.ts              — GET 列表 / POST 添加
│   └── [id]/route.ts         — DELETE 解除
├── supervise/rules/
│   ├── route.ts              — GET 列表 / POST 创建
│   └── [id]/route.ts         — PUT 更新 / DELETE 删除
├── export/route.ts           — GET 导出 PDF/CSV
└── notifications/email/route.ts — POST 发送邮件
```

### 3.4 实现 SSE 流式分析的真实调用

```typescript
// analysis/page.tsx
const handleAnalyze = async () => {
  setIsAnalyzing(true);
  setResult([]);
  
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeRange, dimensions, analysisType, records: [...] }),
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // 解析 SSE data 行
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6);
      setResult(prev => [...prev, data]);
    }
  }
  
  setIsAnalyzing(false);
};
```

### 3.5 完善 Drizzle Relations

```typescript
// src/storage/database/shared/relations.ts
import { relations } from "drizzle-orm/relations";
import { profiles, records, goals, supervisionRelations, reminderRules } from "./schema";

export const profilesRelations = relations(profiles, ({ many }) => ({
  records: many(records),
  goals: many(goals),
  supervisedRelations: many(supervisionRelations, { relationName: "supervisor" }),
  beingSupervised: many(supervisionRelations, { relationName: "supervised" }),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  user: one(profiles, { fields: [records.userId], references: [profiles.userId] }),
  goal: one(goals, { fields: [records.goalId], references: [goals.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(profiles, { fields: [goals.userId], references: [profiles.userId] }),
  records: many(records),
}));
```

---

## 四、P2 — 体验提升

### 4.1 使用 shadcn/ui 组件替换手写 HTML

**优先替换的组件**（出现频率最高）：

| 手写模式 | 替换为 | 出现次数 |
|----------|--------|----------|
| `<button className="...rounded-lg...">` | `<Button>` | ~30 |
| `<div className="bg-surface/40 backdrop-blur...">` | `<Card>` | ~20 |
| `<input className="...bg-surface-container...">` | `<Input>` | ~15 |
| `<select className="...">` | `<Select>` | ~5 |
| 手写 modal 覆盖层 | `<Dialog>` / `<AlertDialog>` | ~6 |
| 手写底部面板 | `<Sheet>` | ~4 |
| 手写标签组 | `<Tabs>` | ~3 |
| 手写开关 | `<Switch>` | ~3 |

### 4.2 使用 Recharts 替代手写 SVG

```typescript
// 当前：100+ 行手写 SVG
<svg viewBox="0 0 600 160">
  <defs>...</defs>
  <path d="M40,120 L120,100 ..." />
  {/* ... */}
</svg>

// 替换为：
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={trendData}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="value" stroke="#7C5CFF" fill="url(#colorValue)" />
  </AreaChart>
</ResponsiveContainer>
```

### 4.3 添加错误边界和加载态

```typescript
// src/app/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>出了点问题</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>重试</Button>
    </div>
  );
}

// src/app/(main)/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### 4.4 抽取可复用组件

```
src/components/
├── charts/
│   ├── trend-chart.tsx       — 趋势折线图
│   ├── radar-chart.tsx       — 雷达图
│   ├── progress-ring.tsx     — 进度环
│   ├── heatmap.tsx           — 热力图
│   └── pie-chart.tsx         — 饼图
├── cards/
│   ├── stat-card.tsx         — 统计卡片（仪表盘/监督/网关复用）
│   ├── record-card.tsx       — 记录卡片
│   └── goal-card.tsx         — 目标卡片
├── forms/
│   ├── record-form.tsx       — 记录表单
│   ├── goal-form.tsx         — 目标表单
│   └── rule-form.tsx         — 规则表单
└── shared/
    ├── empty-state.tsx       — 空态组件
    ├── error-state.tsx       — 错误态
    └── loading-skeleton.tsx  — 骨架屏
```

### 4.5 添加输入验证（Zod）

```typescript
// src/lib/validations/record.ts
import { z } from 'zod';

export const createRecordSchema = z.object({
  timeDimension: z.enum(['daily', 'weekly', 'monthly', 'annual', 'morning', 'noon', 'evening', 'custom']),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  learning: z.record(z.unknown()).optional(),
  work: z.record(z.unknown()).optional(),
  life: z.record(z.unknown()).optional(),
  health: z.record(z.unknown()).optional(),
  mood: z.record(z.unknown()).optional(),
  moodScore: z.number().int().min(1).max(10).optional(),
  summary: z.string().max(500).optional(),
  goalId: z.string().uuid().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
```

---

## 五、P3 — 锦上添花

### 5.1 国际化 (i18n)

当前所有文本硬编码为中文，如需支持多语言，建议引入 `next-intl`。

### 5.2 PWA 支持

添加 Service Worker 和 manifest.json，支持离线访问和安装到桌面。

### 5.3 暗色/亮色主题切换

当前仅有暗色主题。DESIGN.md 中定义了设计规范，可基于 CSS 变量实现主题切换。

### 5.4 数据导入

支持从其他工具（如 Notion、Excel）导入历史数据。

### 5.5 移动端优化

- 底部导航栏（替代侧边栏）
- 手势操作（滑动删除、下拉刷新）
- 触觉反馈

---

## 六、实施路线图

```
Phase 1 (Week 1-2): P0 安全修复
  ├── API 鉴权中间件
  ├── 中间件角色守卫
  └── RLS 策略配置

Phase 2 (Week 3-4): P1 核心功能
  ├── Drizzle ORM 迁移
  ├── 前端接入 API
  ├── 缺失 API 实现
  └── SSE 流式分析

Phase 3 (Week 5-6): P2 体验提升
  ├── shadcn/ui 组件替换
  ├── Recharts 图表
  ├── 错误边界
  └── 输入验证

Phase 4 (Week 7+): P3 增强
  ├── 测试编写
  ├── 性能优化
  └── 国际化
```
