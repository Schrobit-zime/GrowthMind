# AGENTS.md — GrowthMind

## 项目概览

GrowthMind 是个人成长多维数据记录与智能分析平台。用户可按日报/周报/月报/年报/早午晚报等时间维度记录学习、工作、生活、身体、心情五维数据，系统通过 LLM 生成趋势分析与优化建议，并以可视化图表呈现。

- **技术栈**: Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **后端服务**: Supabase (Auth + PostgreSQL) + Drizzle ORM
- **设计风格**: 毛玻璃风（深色背景 #070A14、玻璃层 rgba(255,255,255,.08)、主色 #7C5CFF）
- **包管理**: pnpm（严禁 npm / yarn）

## 构建和测试命令

```bash
# 安装依赖
pnpm install

# 开发环境（HMR，端口由 DEPLOY_RUN_PORT 环境变量决定）
pnpm run dev

# 生产构建
pnpm run build

# 生产启动
pnpm run start

# 静态检查
pnpm ts-check          # TypeScript 类型检查
pnpm lint --quiet      # ESLint 检查

# 数据库 Schema 升级
npx drizzle-kit push
```

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（SupabaseConfigProvider + AuthProvider）
│   ├── globals.css               # 全局样式 + Design Token
│   ├── (auth)/login/page.tsx     # 登录/注册页
│   ├── (main)/                   # 主区域（需登录）
│   │   ├── layout.tsx            # AppLayout（侧边栏+顶栏）
│   │   ├── page.tsx              # 仪表盘首页
│   │   ├── records/page.tsx      # 记录列表
│   │   ├── record-form/page.tsx  # 记录录入
│   │   ├── record-detail/page.tsx# 记录详情
│   │   ├── analysis/page.tsx     # 智能分析
│   │   ├── goals/page.tsx        # 目标管理
│   │   ├── goal-detail/page.tsx  # 目标详情
│   │   ├── supervise/page.tsx    # 监督面板（admin）
│   │   ├── supervise-user-detail/page.tsx # 被监督用户详情
│   │   ├── supervise-rules/page.tsx       # 提醒规则配置
│   │   └── gateway/page.tsx      # 模型网关管理台
│   └── api/                      # API Routes
│       ├── supabase-config/route.ts  # GET Supabase 配置
│       ├── records/route.ts          # GET 列表 / POST 创建
│       ├── records/[id]/route.ts     # GET/PUT/DELETE 单条
│       ├── goals/route.ts            # GET 列表 / POST 创建
│       ├── goals/[id]/route.ts       # GET/PUT/DELETE 单条
│       ├── analysis/route.ts         # POST 触发 LLM 流式分析 (SSE)
│       └── gateway/route.ts          # GET 状态 / POST 统一模型网关
├── components/
│   ├── auth/                    # 认证组件
│   │   ├── auth-provider.tsx    # 认证上下文（登录/注册/登出/角色）
│   │   └── supabase-config-provider.tsx # Supabase 配置 Provider
│   ├── layout/
│   │   └── app-layout.tsx       # 侧边栏+顶栏布局
│   └── ui/                      # shadcn/ui 组件库
├── lib/
│   ├── supabase-browser.ts      # 浏览器端 Supabase 客户端
│   └── utils.ts                 # cn() 工具函数
├── storage/database/
│   ├── shared/
│   │   ├── schema.ts            # Drizzle ORM Schema（7 张表）
│   │   └── relations.ts         # 表关联定义
│   └── supabase-client.ts       # 服务端 Supabase 客户端封装
└── middleware.ts                 # 角色路由守卫（admin 专属路由保护）
```

## 代码风格指南

### TypeScript
- 严格模式心智：禁止隐式 `any`、`as any`；函数参数/返回值/事件对象必须有类型
- 禁止在 JSX render 中直接使用 `typeof window`、`Date.now()`、`Math.random()` 等动态值
- 使用 `'use client'` + `useEffect` + `useState` 处理客户端动态内容

### React / Next.js
- 禁止使用 `<head>` 标签，使用 `generateMetadata` 或 `ReactDOM.preconnect/preload`
- 禁止非法 HTML 嵌套（如 `<p>` 嵌套 `<div>`）
- 动态路由参数使用 `params: Promise<{ id: string }>` 模式（Next.js 16）
- 配置路径使用 `path.resolve(__dirname, ...)` 等动态拼接，禁止硬编码绝对路径

### 样式
- 使用 Tailwind CSS v4 utility class，Design Token 定义在 `globals.css` 的 `@theme` 中
- 变量命名遵循 shadcn/ui 规范：`--primary` / `--primary-foreground` / `--foreground` / `--muted` / `--muted-foreground` / `--card` / `--border` / `--destructive`
- 原型 HTML 是唯一视觉标准，实现时完整迁移 class（变量名按映射表转换）

### API Routes
- 统一响应格式：`{ success: boolean, data?: T, error?: string }`
- 数据库操作通过 `getSupabaseClient()` 获取客户端，使用 snake_case 列名（数据库实际列名）
- 流式输出使用 SSE 协议：`Content-Type: text/event-stream` + `ReadableStream`

## 数据库 Schema

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `profiles` | 用户表 | id, email, role(admin/user), display_name |
| `records` | 成长记录 | id, user_id, time_dimension, record_date, learning/work/life/health/mood(JSONB), mood_score, summary, goal_id |
| `goals` | 目标 | id, user_id, name, dimension, metric, target_value, current_value, deadline, status |
| `supervision_relations` | 监督关系 | id, admin_user_id, supervised_user_id, status |
| `reminder_rules` | 提醒规则 | id, admin_user_id, supervised_user_id, type, frequency, enabled |
| `gateway_usage_logs` | 网关用量 | id, user_id, provider, model, tokens_in, tokens_out, cost |
| `analysis_history` | 分析历史 | id, user_id, analysis_type, input_summary, result, created_at |

## 认证与权限

- 登录方式：邮箱密码（Supabase Auth）
- 前端请求携带 `x-session` header（值为 Supabase session access_token）
- 中间件 `middleware.ts` 实现角色路由守卫：`/supervise*` 仅 admin 可访问
- 认证上下文 `AuthProvider` 提供：user, session, signIn, signUp, signOut, role, profile

## 设计规范

详见 `DESIGN.md`。核心要点：
- 深色背景 #070A14，毛玻璃卡片 rgba(255,255,255,.08)
- 主色 #7C5CFF，强调色 #69E7FF
- 字体 Inter / Manrope，标题紧凑，数字放大
- 动效：轻微浮动、光晕 hover、背景渐变缓慢漂移

## 常见问题

### TypeScript 报错 "Property 'select' does not exist on type 'SupabaseClient'"
使用 `getSupabaseClient()` 返回的是 Supabase JS 客户端，支持 `.from().select()` 等链式调用。如果 IDE 类型推断失败，检查 `@supabase/supabase-js` 版本。

### 页面样式与原型不一致
检查 `globals.css` 中 `@theme` 变量是否完整，对照原型 HTML 的 `@theme` 逐项核对。变量名需按映射表转换（如原型 `--color-on-primary` → 项目 `--primary-foreground`）。

### API 返回 500 "API Key 未配置"
`/api/analysis` 和 `/api/gateway` 依赖环境变量（如 `DEEPSEEK_API_KEY`），需在部署环境配置。

### 记录创建后 PUT 返回 404
检查 `record_date` 字段格式（应为 `YYYY-MM-DD`），以及 `time_dimension` 是否为合法值（daily/weekly/monthly/yearly/custom）。
