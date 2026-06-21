# P2 体验提升 — 任务总览

## 阶段说明

P2 阶段聚焦于 **用户体验提升**，主要目标是将 GrowthMind 项目从"能用"提升到"好用"。核心工作包括：shadcn/ui 组件替换手写元素、Recharts 图表替换手写 SVG、抽取可复用组件、完善错误边界与加载态、Server Components 改造、建立测试体系。

## 任务列表

| 编号 | 任务名称 | 预估工时 | 依赖 |
|------|---------|---------|------|
| P2-01 | shadcn/ui 组件替换 | 3 人天 | 无 |
| P2-02 | Recharts 图表迁移 | 2 人天 | 无 |
| P2-03 | 可复用组件抽取 | 2 人天 | P2-01, P2-02 |
| P2-04 | 错误边界与加载态完善 | 1.5 人天 | 无 |
| P2-05 | Server Components 改造 | 1.5 人天 | 无 |
| P2-06 | 测试体系建设 | 2 人天 | 无 |

**总计：12 人天**

## 执行顺序

```
阶段一（并行）：
  ├── P2-01 (shadcn/ui)
  ├── P2-02 (Recharts)
  ├── P2-04 (错误边界)
  ├── P2-05 (Server Components)
  └── P2-06 (测试)

阶段二（依赖阶段一）：
  └── P2-03 (可复用组件)
```

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 + shadcn/ui
- Recharts 2.x
- Supabase (Auth + PostgreSQL) + Drizzle ORM
- Vitest + Testing Library + Playwright
- pnpm 包管理

## 设计规范

- 毛玻璃风深色主题
- 背景色：`#070A14`
- 主色：`#7C5CFF`
- 强调色：`#69E7FF`
- 所有 shadcn/ui 组件需通过 className 覆盖保持毛玻璃风格

## 关键文件路径

- 核心页面：`src/app/(main)/` 下各 `page.tsx`
- UI 组件：`src/components/ui/`（60+ shadcn/ui 组件已安装）
- 全局样式：`src/app/globals.css`
- 错误边界：`src/app/error.tsx`、`src/app/not-found.tsx`、`src/app/(main)/error.tsx`
- 加载态：`src/app/(main)/loading.tsx`

## 验收总则

- 所有变更不破坏现有功能
- 保持毛玻璃风设计风格一致
- 通过 `pnpm typecheck` 类型检查
- 通过 `pnpm lint` 代码规范检查
- 通过 `pnpm build` 构建成功