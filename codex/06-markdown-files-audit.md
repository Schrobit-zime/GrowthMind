# GrowthMind Markdown 文件审查报告

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、Markdown 文件清单

| 文件 | 路径 | 行数 | 用途 |
|------|------|------|------|
| README.md | `projects/README.md` | ~140 | 项目说明 |
| AGENTS.md | `projects/AGENTS.md` | ~120 | AI 开发规范 |
| DESIGN.md | `projects/DESIGN.md` | ~25 | 设计规范 |
| plan.md | `.cozeproj/documents/plan.md` | ~350 | 实施计划 |
| residual-issues.md | `.cozeproj/documents/residual-issues.md` | ~200 | 残余问题 |

## 二、逐文件审查

### 2.1 README.md

**路径**：`/Users/jahangir/workspace/GrowthMind/projects/README.md`

**内容概要**：项目快速开始指南、目录结构、开发规范、技术栈说明。

**问题**：

1. **标题不准确**：`# projects` 应改为 `# GrowthMind`
2. **与实际代码不符**：
   - 建议使用 `react-hook-form + zod` 进行表单开发，但实际页面使用 `useState` 管理表单
   - 建议使用 Prisma 或 Drizzle ORM，但实际使用 Supabase JS SDK
   - 提到 "推荐使用 React Context 或 Zustand"，但项目未使用 Zustand
3. **过时信息**：提到 `server/` 目录和自定义服务器，但实际 `src/server.ts` 存在但未被使用
4. **缺少关键信息**：
   - 无环境变量配置说明
   - 无 Supabase 配置步骤
   - 无部署说明
   - 无贡献指南
5. **技术栈版本不一致**：README 提到 React 18，但 `package.json` 显示 React 19.2.3

**评分**：⭐⭐⭐ (3/5) — 作为模板可用，但需大量更新以反映实际项目

---

### 2.2 AGENTS.md

**路径**：`/Users/jahangir/workspace/GrowthMind/projects/AGENTS.md`

**内容概要**：AI 开发规范，包括项目概览、构建命令、目录结构、代码风格、数据库 Schema、认证权限、设计规范。

**问题**：

1. **Schema 与实际不符**：
   - AGENTS.md 列出 7 张表（users/records/goals/supervision_relations/reminder_rules/gateway_usage_logs/analysis_history）
   - 实际 schema.ts 定义了 9 张表（profiles/records/goals/supervision_relations/reminder_rules/analysis_history/gateway_usage_log/email_templates/health_check）
   - 表名 `users` vs `profiles`、`gateway_usage_logs` vs `gateway_usage_log` 不一致

2. **字段名不一致**：
   - AGENTS.md：`supervision_relations.supervisor_id` / `supervisee_id`
   - 实际：`supervision_relations.admin_user_id` / `supervised_user_id`

3. **缺少的 API 路由**：
   - AGENTS.md 提到 `GET/POST /api/v1/supervise` 等，但实际路由无 `/v1/` 前缀
   - AGENTS.md 列出的 API 比实际实现的多（supervise/rules/export/notifications 未实现）

4. **React 版本不一致**：
   - AGENTS.md 说 "React 18"
   - package.json 显示 React 19.2.3

5. **正面评价**：
   - 代码风格指南详细且实用
   - 常见问题 FAQ 有价值
   - 目录结构说明清晰

**评分**：⭐⭐⭐⭐ (4/5) — 质量较高，但需同步更新以反映实际代码

---

### 2.3 DESIGN.md

**路径**：`/Users/jahangir/workspace/GrowthMind/projects/DESIGN.md`

**内容概要**：毛玻璃风设计规范，包括色彩、字体、布局、组件、动效。

**问题**：

1. **过于简短**：仅 25 行，作为设计规范不够详细
2. **缺少关键信息**：
   - 无间距/网格系统规范
   - 无响应式断点定义
   - 无组件状态定义（hover/active/disabled/focus）
   - 无无障碍（a11y）对比度要求
   - 无图标规范
   - 无图片/插图规范
3. **缺少设计令牌映射**：未说明设计稿中的颜色名如何映射到 CSS 变量

**正面评价**：
- 色彩定义清晰，与 `globals.css` 一致
- "禁忌" 部分有指导价值

**评分**：⭐⭐ (2/5) — 作为设计规范过于简略，建议扩展

---

### 2.4 plan.md（实施计划）

**路径**：`/Users/jahangir/workspace/GrowthMind/projects/.cozeproj/documents/plan.md`

**内容概要**：完整的项目实施计划，包括技术方案、功能模块、数据结构、页面规格、交互说明。

**问题**：

1. **React 版本不一致**：计划写 "React 18"，实际为 React 19
2. **Redis 依赖未实现**：计划中提到 Redis 用于缓存/会话/限流，但完全未集成
3. **邮件服务未实现**：计划中提到 Resend/Nodemailer，但无任何实现
4. **API 路径不一致**：
   - 计划：`/api/v1/records`
   - 实际：`/api/records`（无 v1 前缀）
5. **数据结构示例过于理想化**：
   - 计划中的 `Record.dimensions.learning.duration_minutes` 等嵌套结构
   - 实际使用 JSONB 存储，结构更松散

**正面评价**：
- 页面规格极为详细（每个页面的交互表）
- 功能模块定义清晰
- 实施步骤有逻辑顺序

**评分**：⭐⭐⭐⭐ (4/5) — 作为规划文档质量很高，但需与实际实现同步

---

### 2.5 residual-issues.md（残余问题）

**路径**：`/Users/jahangir/workspace/GrowthMind/projects/.cozeproj/documents/residual-issues.md`

**内容概要**：记录项目开发过程中的残余问题，按优先级分类。

**问题**：

1. **部分问题可能已修复**：文档标注了 "已修复" 状态，但未更新总体状态
2. **缺少时间戳更新**：最后更新为 2025-07-14，距今已过时
3. **P0 问题可能仍存在**：
   - TS 类型错误：supabase-client.ts 的 createClient 导入冲突
   - 接口冒烟测试未执行

**正面评价**：
- 问题分类清晰（P0/P1/P2/P3）
- 修复建议具体可操作
- 文件清单完整

**评分**：⭐⭐⭐⭐ (4/5) — 问题追踪文档质量高，但需定期更新

---

## 三、文档间一致性检查

### 3.1 版本号不一致

| 信息 | README | AGENTS | plan | package.json |
|------|--------|--------|------|--------------|
| React 版本 | 18 ❌ | 18 ❌ | 18 ❌ | **19.2.3** ✅ |
| Next.js 版本 | 16 ✅ | 16 ✅ | — | 16.1.1 ✅ |
| 包管理器 | pnpm ✅ | pnpm ✅ | pnpm ✅ | pnpm ✅ |

### 3.2 表名不一致

| 表 | AGENTS.md | schema.ts |
|----|-----------|-----------|
| 用户表 | `users` | `profiles` |
| 网关日志 | `gateway_usage_logs` | `gateway_usage_log` |
| 邮件模板 | 未提及 | `email_templates` |
| 健康检查 | 未提及 | `health_check` |

### 3.3 API 路径不一致

| API | plan.md | AGENTS.md | 实际实现 |
|-----|---------|-----------|----------|
| 记录 | `/api/v1/records` | `/api/v1/records` | `/api/records` |
| 目标 | `/api/v1/goals` | `/api/v1/goals` | `/api/goals` |
| 分析 | `/api/v1/analysis` | `/api/v1/analysis` | `/api/analysis` |
| 网关 | `/api/v1/gateway` | `/api/v1/gateway` | `/api/gateway` |

## 四、Markdown 文件优化建议

### 4.1 README.md 更新清单

- [ ] 标题改为 `# GrowthMind`
- [ ] 更新 React 版本为 19
- [ ] 添加环境变量配置说明
- [ ] 添加 Supabase 配置步骤
- [ ] 更新数据库访问方式（Drizzle vs Supabase SDK）
- [ ] 添加部署说明
- [ ] 移除 server/ 相关说明（或实际使用它）

### 4.2 AGENTS.md 更新清单

- [ ] 修正表名（users → profiles）
- [ ] 修正字段名（supervisor_id → admin_user_id）
- [ ] 添加 email_templates 和 health_check 表
- [ ] 更新 React 版本为 19
- [ ] 移除未实现的 API 路由（或标注为计划中）
- [ ] 统一 API 路径（移除 /v1/ 前缀）

### 4.3 DESIGN.md 扩展清单

- [ ] 添加间距系统（4px 基准网格）
- [ ] 添加响应式断点定义
- [ ] 添加组件状态规范
- [ ] 添加无障碍对比度要求
- [ ] 添加图标使用规范
- [ ] 添加设计令牌映射表

### 4.4 建议新增的文档

| 文档 | 用途 |
|------|------|
| `CONTRIBUTING.md` | 贡献指南 |
| `CHANGELOG.md` | 版本变更记录 |
| `.env.example` | 环境变量模板 |
| `docs/api.md` | API 接口文档 |
| `docs/database.md` | 数据库设计文档 |
| `docs/deployment.md` | 部署指南 |

## 五、总结

| 文件 | 质量 | 主要问题 |
|------|------|----------|
| README.md | ⭐⭐⭐ | 与实际代码脱节 |
| AGENTS.md | ⭐⭐⭐⭐ | 表名/字段名不一致 |
| DESIGN.md | ⭐⭐ | 过于简略 |
| plan.md | ⭐⭐⭐⭐ | 高质量但需同步 |
| residual-issues.md | ⭐⭐⭐⭐ | 需更新状态 |

**核心建议**：所有 Markdown 文档都需要与当前代码库进行一次全面同步，特别是修正版本号、表名、API 路径等关键信息的不一致。
