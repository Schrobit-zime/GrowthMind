# GrowthMind 残余问题文档

> 生成时间：2025-07-14 | 项目阶段：代码开发中（第二轮 test_run 未通过）

---

## 一、项目当前状态总览

### 已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化 | ✅ | Next.js 16 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui |
| 原型设计 | ✅ | 12 个 HTML 原型页面（home/records/record-form/record-detail/analysis/goals/goal-detail/supervise/supervise-user-detail/supervise-rules/gateway/login） |
| Design Token 迁移 | ✅ | globals.css 中完整定义 @theme + :root 变量 |
| 数据库 Schema | ✅ | 8 张表（profiles/supervision_relations/records/goals/reminder_rules/analysis_history/gateway_usage_log/email_templates） |
| 认证模块 | ✅ | Supabase Auth 邮箱登录 + AuthProvider + SupabaseConfigProvider |
| 布局与导航 | ✅ | AppLayout（侧边栏 + 顶栏 + 角色区分）+ 路由守卫 |
| 登录页 | ✅ | 毛玻璃风登录/注册页 |
| 前端页面（10个） | ✅ | 全部使用 Mock 数据渲染，毛玻璃风样式 |
| API Routes（5个） | ✅ | records CRUD / goals CRUD / analysis / gateway / supabase-config |
| Lint 错误修复 | ✅ | 第一轮 test_run 发现的 2 个 lint 错误已修复 |

### 阻塞中

| 问题 | 严重程度 | 详情 |
|------|----------|------|
| TypeScript 类型错误 | 🔴 阻塞 | supabase-client.ts 与 API routes 的类型推断冲突 |

---

## 二、残余问题清单

### 🔴 P0 — 阻塞验证流程

#### 2.1 TypeScript 类型错误（第二轮 test_run 失败）

**现象**：`test_run` 返回 TS 类型错误，涉及以下文件：

1. **`src/storage/database/supabase-client.ts:1`**
   - 错误：`Import declaration conflicts with local declaration of 'createClient'`
   - 原因：文件顶部 `import { createClient } from '@supabase/supabase-js'` 与本地定义的 `createClient` 函数名冲突
   - 状态：已修复（移除 import 中的 createClient）

2. **API routes 中的 Supabase 客户端类型问题**
   - 错误：`Property 'select'/'insert'/'update'/'delete' does not exist on type 'SupabaseClient<...>'`
   - 原因：`getSupabaseClient()` 返回的 `SupabaseClient` 类型推断不完整，`.from().select()` 等方法在 TS 层面不可用
   - 状态：已重写 `records/route.ts`、`records/[id]/route.ts`、`goals/route.ts`，改用 Drizzle ORM 模式

3. **`src/storage/database/supabase-client.ts:116`**
   - 错误：`Expected 0-1 arguments, but got 3`
   - 原因：`createClient` 函数签名与 Supabase JS SDK 的类型定义不匹配
   - 状态：待修复

**修复建议**：
- 方案 A（推荐）：统一使用 Drizzle ORM 作为数据库访问层，API routes 全部通过 `db.select().from()` 等 Drizzle API 操作数据库，不再直接使用 Supabase 客户端的 `.from().select()` 方法
- 方案 B：修复 supabase-client.ts 的类型导出，确保 `getSupabaseClient()` 返回正确的泛型类型 `SupabaseClient<Database>`

#### 2.2 接口冒烟测试未执行

**原因**：静态检查（ts-check）未通过，无法进入接口测试阶段。

**待测试的 5 个 API 接口**：
| 接口 | 方法 | 路径 |
|------|------|------|
| 记录列表 | GET | `/api/records` |
| 创建记录 | POST | `/api/records` |
| 记录详情 | GET | `/api/records/[id]` |
| 更新记录 | PUT | `/api/records/[id]` |
| 删除记录 | DELETE | `/api/records/[id]` |
| 目标列表 | GET | `/api/goals` |
| 创建目标 | POST | `/api/goals` |
| 智能分析 | POST | `/api/analysis` |
| 模型网关 | POST | `/api/gateway` |
| 模型网关状态 | GET | `/api/gateway` |

---

### 🟡 P1 — 后端功能未完整实现

#### 2.3 监督系统 API 缺失

**计划要求**：`GET/POST /api/v1/supervise`、`GET /api/v1/supervise/users/:id`

**当前状态**：无任何 supervision 相关 API route。前端 `supervise/page.tsx` 和 `supervise-user-detail/page.tsx` 使用硬编码 Mock 数据。

**需创建**：
- `src/app/api/supervise/route.ts` — GET 监督关系列表 + POST 添加监督
- `src/app/api/supervise/[id]/route.ts` — DELETE 解除监督

#### 2.4 提醒规则 API 缺失

**计划要求**：`GET/POST /api/v1/supervise/rules`

**当前状态**：无任何 reminder_rules 相关 API route。前端 `supervise-rules/page.tsx` 使用硬编码 Mock 数据。

**需创建**：
- `src/app/api/supervise/rules/route.ts` — GET 规则列表 + POST 创建规则
- `src/app/api/supervise/rules/[id]/route.ts` — PUT 更新规则 + DELETE 删除规则

#### 2.5 目标详情 API 缺失

**当前状态**：`goals/route.ts` 只有 GET 列表和 POST 创建，缺少单条目标的 GET/PUT/DELETE。

**需创建**：
- `src/app/api/goals/[id]/route.ts` — GET/PUT/DELETE 单条目标

#### 2.6 数据导出 API 缺失

**计划要求**：`GET /api/v1/export`（PDF + CSV）

**当前状态**：完全未实现。`package.json` 中已安装 `jspdf` 和 `papaparse`。

**需创建**：
- `src/app/api/export/route.ts` — GET 导出（支持 `?format=pdf|csv` 参数）

#### 2.7 邮件系统未集成

**计划要求**：Resend / Nodemailer 邮件发送

**当前状态**：`emailTemplates` 表已定义但无任何邮件发送逻辑。无邮件 API route。

**需创建**：
- `src/lib/mail/` — 邮件发送工具模块
- `src/app/api/notifications/email/route.ts` — POST 触发邮件发送

---

### 🟢 P2 — 前端 Mock 数据待替换

#### 2.8 智能分析页的 LLM 调用为 Mock

**文件**：`src/app/(main)/analysis/page.tsx`

**当前**：使用 `setTimeout` 模拟流式输出，未真正调用 `/api/analysis`。

**需修改**：改为 `fetch('/api/analysis', { method: 'POST', body: ... })` + `reader.read()` 实现真正的 SSE 流式读取。

#### 2.9 监督用户详情页 Tab 内容不完整

**文件**：`src/app/(main)/supervise-user-detail/page.tsx`

**当前**：仅"概览" Tab 有内容，"记录"/"目标"/"分析" Tab 为占位文字。

**需实现**：各 Tab 从 API 获取真实数据。

#### 2.10 模型网关管理台数据为 Mock

**文件**：`src/app/(main)/gateway/page.tsx`

**当前**：使用硬编码 `mockStats`、`vendorData`、`mockDetails`。

**需修改**：从 `/api/gateway` GET 接口获取真实统计数据。

#### 2.11 Redis 缓存层未集成

**计划要求**：分析结果缓存、会话管理、限流。

**当前状态**：完全未实现。无 Redis 客户端初始化代码。

**需创建**：
- `src/lib/redis/` — Redis 客户端 + 缓存工具函数

---

### 🔵 P3 — 工程完善

#### 2.12 AGENTS.md 未生成

项目根目录存在 `AGENTS.md` 但内容为通用模板，未根据 GrowthMind 项目实际情况定制。

#### 2.13 日志健康检查未执行

交付前必须检查 `/app/work/logs/bypass/` 下的日志文件是否存在异常。

#### 2.14 middleware.ts 角色路由守卫未启用

**文件**：`src/middleware.ts`

**当前**：仅做 `NextResponse.next()` 透传，未实现计划中的角色路由守卫（admin 专属路由保护）。

**需实现**：检查 session + profile.role，对 `/supervise*`、`/gateway*` 路由限制仅 admin 可访问。

---

## 三、文件清单

### 项目源码文件（共 85 个 .ts/.tsx 文件）

```
src/
├── app/
│   ├── (auth)/login/page.tsx          # 登录/注册页
│   ├── (main)/
│   │   ├── layout.tsx                 # 主区域布局（认证守卫）
│   │   ├── page.tsx                   # 仪表盘首页
│   │   ├── analysis/page.tsx          # 智能分析页
│   │   ├── gateway/page.tsx           # 模型网关管理台
│   │   ├── goal-detail/page.tsx       # 目标详情页
│   │   ├── goals/page.tsx             # 目标管理页
│   │   ├── record-detail/page.tsx     # 记录详情页
│   │   ├── record-form/page.tsx       # 记录录入页
│   │   ├── records/page.tsx           # 记录列表页
│   │   ├── supervise/page.tsx         # 监督面板
│   │   ├── supervise-rules/page.tsx   # 提醒规则配置
│   │   └── supervise-user-detail/page.tsx  # 被监督用户详情
│   ├── api/
│   │   ├── analysis/route.ts          # 智能分析 API
│   │   ├── gateway/route.ts           # 模型网关 API
│   │   ├── goals/route.ts             # 目标 CRUD API
│   │   ├── records/
│   │   │   ├── route.ts               # 记录列表/创建 API
│   │   │   └── [id]/route.ts          # 记录详情/更新/删除 API
│   │   └── supabase-config/route.ts   # Supabase 配置 API
│   ├── layout.tsx                     # 根布局
│   ├── page.tsx                       # 根页面（重定向）
│   └── robots.ts
├── components/
│   ├── auth/
│   │   ├── auth-provider.tsx          # 认证上下文
│   │   └── supabase-config-provider.tsx  # Supabase 配置 Provider
│   ├── layout/
│   │   └── app-layout.tsx             # 应用布局（侧边栏+顶栏）
│   └── ui/                            # shadcn/ui 组件库（60+ 组件）
├── hooks/
│   └── use-mobile.ts
├── lib/
│   ├── supabase-browser.ts            # 浏览器端 Supabase 客户端
│   └── utils.ts                       # cn() 工具函数
├── middleware.ts                      # 路由中间件
├── server.ts                          # 自定义服务端入口
└── storage/database/
    ├── shared/
    │   ├── relations.ts               # Drizzle 表关系
    │   └── schema.ts                  # 数据库 Schema 定义
    └── supabase-client.ts             # 服务端 Supabase 客户端
```

### 配置文件

| 文件 | 说明 |
|------|------|
| `.coze` | 项目启动配置 |
| `package.json` | 依赖管理 |
| `tsconfig.json` | TypeScript 配置 |
| `next.config.ts` | Next.js 配置 |
| `DESIGN.md` | 毛玻璃风设计规范 |
| `AGENTS.md` | 项目工程规范（待更新） |
| `.cozeproj/documents/plan.md` | 完整实施计划 |

---

## 四、建议修复顺序

1. **修复 TS 类型错误** → 通过 `test_run` 静态检查
2. **执行接口冒烟测试** → 验证已有 5 个 API routes
3. **补充缺失 API**：goals/[id]、supervise、supervise/rules、export
4. **替换前端 Mock 数据**：analysis、gateway、supervise 页面接入真实 API
5. **实现邮件系统**：lib/mail + notifications/email API
6. **集成 Redis 缓存**
7. **完善 middleware 角色守卫**
8. **生成 AGENTS.md**
9. **日志健康检查**
