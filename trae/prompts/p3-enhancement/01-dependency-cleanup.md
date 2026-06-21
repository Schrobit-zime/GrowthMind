# 依赖清理 — 清理未使用的依赖，减小包体积

## 项目上下文

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- package.json：`/Users/jahangir/workspace/GrowthMind/projects/package.json`
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 当前仅支持暗色主题

## 任务目标

扫描并清理项目 `package.json` 中未使用的依赖，减小 node_modules 体积和打包产物体积。

## 实施步骤

### 1. 先读取 package.json 了解当前依赖

```bash
# 文件路径：/Users/jahangir/workspace/GrowthMind/projects/package.json
```

### 2. 识别并移除以下确定未使用的依赖

以下依赖在项目中无任何 import 或 require 引用，可直接移除：

**AWS SDK（~5MB，无 S3 代码）**：
- `@aws-sdk/client-s3`
- `@aws-sdk/lib-storage`

**PDF/CSV 导出（当前无导出功能）**：
- `jspdf`
- `papaparse`
- `@types/papaparse`

**Drizzle ORM（当前使用 Supabase JS 客户端直连，未使用 Drizzle）**：
- `drizzle-orm`
- `drizzle-kit`
- `drizzle-zod`
- `pg`
- `@types/pg`

> ⚠️ 注意：`src/storage/database/shared/schema.ts` 和 `src/storage/database/shared/relations.ts` 中定义了 Drizzle Schema，但当前 API Routes 中使用的是 `getSupabaseClient()` 而非 Drizzle 查询。如果这些 Schema 文件仅用于文档参考且从未被实际导入 API 路由，则移除 Drizzle 是安全的。如果未来计划迁移到 Drizzle，请保留。

**表单库（当前未使用 react-hook-form）**：
- `react-hook-form`
- `@hookform/resolvers`

**主题切换（已安装但未使用）**：
- `next-themes`
- `sonner`（Toast 通知，已安装但未使用）

**其他**：
- `coze-coding-dev-sdk` — 如果项目不使用 Coze 开发 SDK，也建议移除

### 3. 需要保留的依赖（不要移除）

- `@radix-ui/*` 系列：shadcn/ui 的底层依赖，即使未直接 import 也必须保留
- `zod`：shadcn/ui 部分组件依赖 zod 进行表单验证
- `recharts`：如果项目中已使用图表组件则保留
- `react-resizable-panels`：如果布局中使用了可调整面板则保留
- `embla-carousel-react`：如果使用了轮播组件则保留
- `input-otp`：如果使用了 OTP 输入组件则保留
- `vaul`：shadcn/ui Sheet/Drawer 组件底层依赖
- `cmdk`：shadcn/ui Command 组件底层依赖
- `react-day-picker`：如果使用了日期选择器则保留
- `class-variance-authority`, `clsx`, `tailwind-merge`：核心工具库
- `tw-animate-css`：Tailwind 动画插件
- `lucide-react`：图标库，项目中大量使用

### 4. 验证并执行清理

```bash
# 在项目目录下执行
cd /Users/jahangir/workspace/GrowthMind/projects

# 使用 pnpm remove 逐个移除，例如：
pnpm remove @aws-sdk/client-s3 @aws-sdk/lib-storage
pnpm remove jspdf papaparse @types/papaparse
pnpm remove drizzle-orm drizzle-kit drizzle-zod pg @types/pg
pnpm remove react-hook-form @hookform/resolvers
pnpm remove next-themes sonner
pnpm remove coze-coding-dev-sdk
```

### 5. 更新 lockfile 并验证构建

```bash
pnpm install
pnpm build
pnpm ts-check
```

## 代码示例

无需新增代码，仅删除依赖。

## 验收标准

- [ ] 所有未使用的依赖已从 `package.json` 的 `dependencies` 中移除
- [ ] `@radix-ui/*` 系列依赖未被误删
- [ ] `pnpm install` 执行成功，无依赖解析错误
- [ ] `pnpm build` 构建成功，无编译错误
- [ ] `pnpm ts-check` 类型检查通过
- [ ] `node_modules` 目录体积明显减小（预期减少 30-50MB）

## 预估工时

0.5 人天

## 依赖

无 — 全部可并行