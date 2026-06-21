# GrowthMind 依赖审计

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、依赖总览

| 类别 | 数量 | 说明 |
|------|------|------|
| 生产依赖 (dependencies) | 42 | |
| 开发依赖 (devDependencies) | 14 | |
| 总计 | 56 | |

## 二、核心依赖分析

### 2.1 已使用且必要

| 包名 | 用途 | 评价 |
|------|------|------|
| `next` 16.1.1 | 框架 | ✅ 核心 |
| `react` / `react-dom` 19.2.3 | UI 库 | ✅ 核心 |
| `typescript` ^5 | 类型系统 | ✅ 核心 |
| `tailwindcss` ^4 | 样式 | ✅ 核心 |
| `@supabase/supabase-js` 2.95.3 | 数据库/认证 | ✅ 核心 |
| `drizzle-orm` / `drizzle-kit` | ORM | ⚠️ 已安装但未使用 |
| `lucide-react` | 图标 | ✅ 使用中 |
| `recharts` 2.15.4 | 图表 | ⚠️ 已安装但未使用（手写 SVG） |
| `react-hook-form` / `@hookform/resolvers` | 表单 | ⚠️ 已安装但未使用（用 useState） |
| `zod` ^4.3.5 | 验证 | ⚠️ 已安装但未使用 |
| `date-fns` ^4.1.0 | 日期处理 | ⚠️ 已安装但未确认使用 |
| `sonner` | Toast 通知 | ⚠️ 已安装但未使用 |
| `class-variance-authority` | 变体样式 | ✅ shadcn/ui 依赖 |
| `clsx` / `tailwind-merge` | 类名合并 | ✅ `cn()` 使用 |
| `dotenv` | 环境变量 | ✅ supabase-client.ts 使用 |

### 2.2 已安装但未使用（浪费）

| 包名 | 用途 | 说明 |
|------|------|------|
| `jspdf` ^4.2.1 | PDF 生成 | 计划用于数据导出，但导出功能未实现 |
| `papaparse` ^5.5.4 | CSV 解析 | 同上 |
| `recharts` | 图表 | 已安装，但所有图表用手写 SVG |
| `react-hook-form` | 表单 | 已安装，但所有表单用 useState |
| `@hookform/resolvers` | 表单验证 | 同上 |
| `zod` | schema 验证 | 已安装，但未在任何地方使用 |
| `drizzle-orm` / `drizzle-kit` / `drizzle-zod` | ORM | Schema 已定义但 API 未使用 |
| `pg` / `@types/pg` | PostgreSQL 驱动 | Drizzle 需要，但 Drizzle 未使用 |
| `next-themes` | 主题切换 | 已安装，但仅有暗色主题 |
| `sonner` | Toast | 已安装，但未使用 |
| `react-day-picker` | 日期选择 | shadcn/ui 日历组件依赖 |
| `react-resizable-panels` | 可调整面板 | 已安装但未使用 |
| `input-otp` | OTP 输入 | shadcn/ui 组件依赖 |
| `cmdk` | 命令面板 | shadcn/ui 组件依赖 |
| `embla-carousel-react` | 轮播 | shadcn/ui 组件依赖 |
| `vaul` | 抽屉 | shadcn/ui 组件依赖 |

### 2.3 Radix UI 组件（shadcn/ui 依赖）

安装了 25 个 `@radix-ui/react-*` 包，其中大部分被 shadcn/ui 组件使用，但如前所述，页面中未使用 shadcn/ui 组件。

**实际被间接使用的**：`@radix-ui/react-slot`（Button 组件内部）

### 2.4 可疑依赖

| 包名 | 说明 |
|------|------|
| `@aws-sdk/client-s3` ^3.958.0 | AWS S3 SDK — 项目中无 S3 相关代码 |
| `@aws-sdk/lib-storage` ^3.958.0 | AWS S3 上传 — 同上 |
| `coze-coding-dev-sdk` ^0.7.24 | 扣子编程 SDK — 仅 supabase-client.ts 使用 |
| `@react-dev-inspector/*` | 开发工具 — 仅开发环境 |

**问题**：`@aws-sdk/*` 包体积巨大（~5MB+），但项目中无任何 S3 相关代码，可能是扣子平台自动安装的。

## 三、开发依赖分析

| 包名 | 用途 | 评价 |
|------|------|------|
| `eslint` / `eslint-config-next` | 代码检查 | ✅ 必要 |
| `tailwindcss` / `@tailwindcss/postcss` | 样式构建 | ✅ 必要 |
| `typescript` / `@types/*` | 类型检查 | ✅ 必要 |
| `shadcn` latest | shadcn CLI | ✅ 用于安装组件 |
| `only-allow` | 包管理器限制 | ✅ preinstall 脚本 |
| `tsup` ^8.3.5 | 打包工具 | ⚠️ 未确认使用 |
| `tsx` ^4.19.2 | TS 执行器 | ⚠️ 未确认使用 |
| `react-dev-inspector` | 开发调试 | ⚠️ 仅开发环境 |

## 四、包体积影响

### 4.1 未使用但增加 bundle 的依赖

| 依赖 | 估计大小 | 影响 |
|------|----------|------|
| `@aws-sdk/*` | ~5 MB | 严重 — 如果被 tree-shake 可忽略 |
| `recharts` | ~400 KB | 中等 — 应使用它替代手写 SVG |
| `jspdf` | ~300 KB | 中等 — 按需加载可缓解 |
| 25 个 `@radix-ui/*` | ~200 KB | 低 — tree-shake 后影响小 |
| `drizzle-orm` + `drizzle-kit` | ~150 KB | 低 — 服务端依赖 |

### 4.2 优化建议

1. **移除 `@aws-sdk/*`**：如无 S3 需求，应从 `package.json` 移除
2. **使用 `recharts`**：替代手写 SVG，既减少自写代码又充分利用已安装依赖
3. **使用 `react-hook-form` + `zod`**：替代 useState 表单管理
4. **按需加载 `jspdf`**：使用 `dynamic import` 仅在导出时加载
5. **确认 `drizzle-orm` 使用计划**：要么迁移到 Drizzle，要么移除相关依赖

## 五、版本安全

### 5.1 关键依赖版本

| 包名 | 当前版本 | 最新稳定版 | 状态 |
|------|----------|-----------|------|
| next | 16.1.1 | 15.x (稳定) | ⚠️ 16 为预发布 |
| react | 19.2.3 | 18.x (稳定) | ⚠️ 19 较新 |
| @supabase/supabase-js | 2.95.3 | 2.x | ✅ |
| zod | 4.3.5 | 3.x (稳定) | ⚠️ 4.x 为预发布 |

### 5.2 建议

- Next.js 16 和 React 19 虽然较新，但已发布，可继续使用
- Zod 4.x 为预发布版，API 可能变化，建议关注更新

## 六、总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 依赖必要性 | 5/10 | 约 40% 的依赖未被使用 |
| 包体积 | 4/10 | AWS SDK 等大包未使用 |
| 版本安全 | 7/10 | 大部分版本合理 |
| 维护性 | 6/10 | 需清理未使用依赖 |

**核心建议**：进行一次依赖清理，移除未使用的包（特别是 `@aws-sdk/*`），并充分利用已安装的优质依赖（recharts、react-hook-form、zod、shadcn/ui）。
