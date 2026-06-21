# GrowthMind 项目解读

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、项目定位

GrowthMind 是一个**个人成长多维数据记录与智能分析平台**，定位为"记录成长，遇见更好的自己"。它不是简单的日记工具，而是一个将个人成长量化、可视化、并借助 AI 提供洞察的全栈 Web 应用。

核心价值主张：
- **多维记录**：覆盖学习、工作、生活、身体、心情五大维度
- **时间灵活**：支持日报/周报/月报/年报/早午晚报等多种时间粒度
- **AI 驱动**：通过统一模型接入层对接多家 LLM，生成趋势分析与优化建议
- **监督协作**：管理员可监督其他用户，设置智能提醒规则

## 二、技术栈全景

| 层级 | 技术选型 | 版本 |
|------|---------|------|
| 框架 | Next.js (App Router) | 16.1.1 |
| UI 框架 | React | 19.2.3 |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS v4 | 4.x |
| 组件库 | shadcn/ui (Radix UI) | 最新 |
| 数据库 | Supabase (PostgreSQL) | 2.95.3 (JS SDK) |
| ORM | Drizzle ORM | 0.45.1 |
| 表单 | React Hook Form + Zod | 7.70 / 4.3 |
| 图表 | Recharts | 2.15.4 |
| 包管理 | pnpm | 9+ |
| 图标 | Lucide React | 0.468.0 |

## 三、功能模块清单

### 已实现（前端 + 部分后端）

| 模块 | 页面 | API | 状态 |
|------|------|-----|------|
| 认证系统 | 登录/注册页 ✅ | Supabase Auth ✅ | 可用 |
| 仪表盘 | 首页 ✅ | — | Mock 数据 |
| 记录管理 | 列表/录入/详情 ✅ | CRUD API ✅ | 部分对接 |
| 智能分析 | 分析页 ✅ | 分析 API ✅ | Mock 前端 |
| 目标管理 | 列表/详情 ✅ | CRUD API ✅ | 部分对接 |
| 监督系统 | 面板/用户详情/规则 ✅ | ❌ 无 API | 纯 Mock |
| 模型网关 | 管理台 ✅ | 网关 API ✅ | Mock 前端 |
| 布局导航 | 侧边栏+顶栏 ✅ | — | 可用 |

### 未实现

| 模块 | 说明 |
|------|------|
| 邮件系统 | 仅数据库表已定义，无发送逻辑 |
| 数据导出 | package.json 已安装 jspdf/papaparse，但无 API |
| Redis 缓存 | 计划中提到但完全未实现 |
| 提醒引擎 | 规则表已定义，无执行引擎 |
| 角色路由守卫 | middleware.ts 仅做透传 |

## 四、数据库 Schema

项目定义了 **9 张表**（含 health_check）：

| 表名 | 字段数 | 说明 |
|------|--------|------|
| `profiles` | 7 | 用户资料（扩展 Supabase auth.users） |
| `records` | 12 | 成长记录（五维 JSONB + 元数据） |
| `goals` | 10 | 目标管理 |
| `supervision_relations` | 5 | 监督关系 |
| `reminder_rules` | 8 | 提醒规则 |
| `analysis_history` | 8 | 分析历史 |
| `gateway_usage_log` | 8 | 网关用量日志 |
| `email_templates` | 6 | 邮件模板 |
| `health_check` | 2 | 健康检查 |

## 五、页面路由结构

```
/login                    — 登录注册（公开）
/                         — 仪表盘（需登录）
/records                  — 记录列表
/record-form              — 记录录入/编辑
/record-detail            — 记录详情
/analysis                 — 智能分析
/goals                    — 目标管理
/goal-detail              — 目标详情
/supervise                — 监督面板（admin）
/supervise-user-detail    — 被监督用户详情（admin）
/supervise-rules          — 提醒规则配置（admin）
/gateway                  — 模型网关管理台（admin）
```

## 六、API Routes

| 路径 | 方法 | 状态 |
|------|------|------|
| `/api/supabase-config` | GET | ✅ 可用 |
| `/api/records` | GET/POST | ✅ 可用 |
| `/api/records/[id]` | GET/PUT/DELETE | ✅ 可用 |
| `/api/goals` | GET/POST | ✅ 可用 |
| `/api/goals/[id]` | GET/PUT/DELETE | ✅ 可用 |
| `/api/analysis` | POST | ✅ 可用（SSE 流式） |
| `/api/gateway` | GET/POST | ✅ 可用 |
| `/api/supervise` | — | ❌ 未实现 |
| `/api/supervise/rules` | — | ❌ 未实现 |
| `/api/export` | — | ❌ 未实现 |
| `/api/notifications/email` | — | ❌ 未实现 |

## 七、设计风格

采用**毛玻璃风（Glassmorphism）**深色主题：
- 背景色：`#070A14`（近纯黑蓝）
- 玻璃层：`rgba(255,255,255,0.08)` 半透明 + `backdrop-blur-xl`
- 主色：`#7C5CFF`（紫色）
- 强调色：`#69E7FF`（青色）
- 成功色：`#62FAD3`（薄荷绿）
- 文字色：`#F7FAFF`（主）/ `#9AA7C7`（次）
- 动效：轻微浮动、光晕 hover、渐变缓慢漂移

## 八、项目成熟度评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 前端完成度 | ⭐⭐⭐⭐ 80% | 12 个页面全部实现，毛玻璃风格统一 |
| 后端完成度 | ⭐⭐ 40% | 核心 CRUD 可用，监督/导出/邮件缺失 |
| 认证系统 | ⭐⭐⭐⭐ 85% | Supabase Auth 集成完整 |
| 数据库设计 | ⭐⭐⭐⭐ 80% | Schema 合理，relations 未配置 |
| 代码质量 | ⭐⭐⭐ 65% | 存在 TS 类型问题和 Mock 数据残留 |
| 测试覆盖 | ⭐ 0% | 无任何测试文件 |
| 文档完整性 | ⭐⭐⭐⭐ 85% | README/AGENTS/DESIGN/plan 齐全 |

**总体评估**：项目处于**原型验证阶段**，前端 UI 已基本成型，后端逻辑需要大量补充才能达到生产可用状态。
