# P1 核心功能完善

## 概述

P1 阶段目标是将 GrowthMind 项目从"框架搭建完成"推进到"核心功能可用"。当前项目已具备完整的页面框架、数据库 Schema 和基础 API Routes，但存在以下问题：

- API Routes 使用 Supabase JS SDK 直接操作数据库，缺少类型安全
- 部分页面仍使用 Mock 数据（仪表盘、目标详情页）
- SSE 流式分析已实现基础版本，但缺少通用 Hook 封装
- 缺少数据导出功能（CSV/PDF）
- 缺少提醒检查引擎

## 任务列表

| 编号 | 任务名称 | 优先级 | 预估工时 | 依赖 |
|------|---------|--------|---------|------|
| P1-01 | Drizzle ORM 迁移 | P0 | 3 人天 | 无 |
| P1-02 | Drizzle Relations 完善 | P1 | 1 人天 | P1-01 |
| P1-03 | 前端 API 接入 | P0 | 2 人天 | 无 |
| P1-04 | SSE 流式分析 | P1 | 1 人天 | 无 |
| P1-05 | 数据导出 | P1 | 1.5 人天 | 无 |
| P1-06 | 提醒引擎 | P1 | 1.5 人天 | 无 |

## 依赖关系图

```
P1-01 (Drizzle 迁移) ──── P1-02 (Drizzle Relations)
P1-03 (前端 API 接入) ─── 独立
P1-04 (SSE 流式)     ─── 独立
P1-05 (数据导出)     ─── 独立
P1-06 (提醒引擎)     ─── 独立
```

## 推荐执行顺序

**第一阶段（并行）**：P1-01 + P1-03 + P1-04 + P1-05 + P1-06
- 五个任务互不依赖，可以同时进行

**第二阶段**：P1-02
- 依赖 P1-01 完成后 Schema 最终状态确认

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + PostgreSQL)
- Drizzle ORM + drizzle-kit
- 包管理：pnpm

## 项目路径

- 项目根目录：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- API Routes：`src/app/api/`
- 页面：`src/app/(main)/`
- 数据库 Schema：`src/storage/database/shared/schema.ts`
- 数据库 Relations：`src/storage/database/shared/relations.ts`

## 验收标准

- [ ] 所有 API Routes 使用 Drizzle ORM 进行数据库操作
- [ ] 所有页面接入真实 API，无 Mock 数据
- [ ] SSE 流式分析正常工作
- [ ] 数据导出功能可用（CSV + PDF）
- [ ] 提醒检查引擎可正常运行