# Tasks

## 安全修复组

- [x] Task 1: 修复 `/api/profile` IDOR 漏洞（P0-01）
  - 添加 authenticateRequest 鉴权，限制用户只能查询自己的 profile，管理员可查询他人
  - 文件：`src/app/api/profile/route.ts`

- [x] Task 2: 修复 Cookie 安全属性（P0-03）
  - 创建服务端 API 设置 httpOnly cookie，修改 auth-provider 和 login 页面
  - 文件：`src/app/api/auth/set-cookie/route.ts`（新建）、`src/components/auth/auth-provider.tsx`、`src/app/(auth)/login/page.tsx`

- [x] Task 3: 加固 middleware 角色检查 + 修复 catch 块放行（P0-06 + P0-07）
  - 角色检查改用 Supabase 客户端直接验证，catch 块对 API 请求返回 401
  - 文件：`src/middleware.ts`

- [x] Task 4: 补充 4 张表 RLS 策略（P0-10）
  - 为 analysis_history、gateway_usage_log、email_templates、health_check 启用 RLS
  - 文件：`src/storage/database/migrations/0003_rls_remaining.sql`

- [x] Task 5: 登录接口限流 + 限流改为 Redis 分布式（P0-18 + P0-19）
  - middleware 对认证路由加强限流，rate-limit.ts 改用 Redis 实现
  - 文件：`src/middleware.ts`、`src/lib/rate-limit.ts`

- [x] Task 6: cron 移除开发环境跳过鉴权（P0-20）
  - 始终要求 CRON_SECRET 验证
  - 文件：`src/app/api/cron/check-reminders/route.ts`

- [x] Task 7: 认证守卫迁移到 middleware + 验证 token 有效性（P1-03 + P1-12）
  - middleware 对所有受保护路由验证 token 有效性，移除 layout 客户端认证检查
  - 文件：`src/middleware.ts`、`src/app/(main)/layout.tsx`

- [x] Task 8: 统一认证机制（P1-07）
  - 创建 `src/lib/auth.ts` 统一 token 提取逻辑
  - 文件：`src/lib/auth.ts`（新建）、`src/lib/api-auth.ts`、`src/lib/auth-server.ts`

- [x] Task 9: drizzle 直连绕过 RLS 修复（P0-02）
  - 已验证所有 10 个 API 路由的 userId 过滤条件完整，无需修改

## 数据/API 修复组

- [x] Task 10: 前端接口字段 snake_case → camelCase（P0-04）
  - 修改 6 个页面的接口定义，与 API 返回 camelCase 对齐
  - 文件：`page.tsx`、`records/page.tsx`、`goals/page.tsx`、`supervise/page.tsx`、`supervise-rules/page.tsx`、`analysis/page.tsx`

- [x] Task 11: 数据库添加索引（P0-05）
  - 创建迁移添加 9 个关键索引
  - 文件：`src/storage/database/migrations/0002_add_indexes.sql`

- [x] Task 12: analysis POST 持久化分析结果（P0-08）
  - SSE 流结束后写入 analysisHistory 表
  - 文件：`src/app/api/analysis/route.ts`

- [x] Task 13: gateway POST 记录调用日志（P0-09）
  - 流式响应完成后写入 gatewayUsageLog 表
  - 文件：`src/app/api/gateway/route.ts`

- [x] Task 14: N+1 查询修复（P0-15）
  - check-reminders 按 ruleType 分组批量查询，Promise.all 并行处理
  - 文件：`src/app/api/cron/check-reminders/route.ts`

- [x] Task 15: 导出接口添加 limit（P0-16）
  - 添加 MAX_EXPORT_ROWS = 10000 限制
  - 文件：`src/app/api/export/route.ts`

- [x] Task 16: 所有路由统一 handleApiError + Zod 校验（P1-08）
  - 4 个路由添加 handleApiError，5 个路由添加 Zod 校验
  - 文件：多个 API 路由文件

- [x] Task 17: 统一响应格式（P1-09）
  - profile 和 supabase-config 路由统一为 `{ success, data, error }` 格式
  - 文件：`src/app/api/supabase-config/route.ts`

- [x] Task 18: 添加外键约束（P1-10）
  - 创建迁移添加 9 个外键约束
  - 文件：`src/storage/database/migrations/0004_add_foreign_keys.sql`

- [x] Task 19: check-reminders 类型安全重构（P1-14）
  - 定义 ReminderRule 类型，消除 6 处 any + 3 处 as any
  - 文件：`src/app/api/cron/check-reminders/route.ts`

## 前端修复组

- [x] Task 20: 5 个页面添加错误态（P0-11）
  - goals、records、supervise、supervise-rules、supervise-user-detail 添加 ErrorState 组件
  - 文件：5 个页面文件

- [x] Task 21: GlobalErrorBoundary 接入（P0-12）
  - 在 `(main)/layout.tsx` 中包裹 children
  - 文件：`src/app/(main)/layout.tsx`

- [x] Task 22: 主题切换修复（P0-13）
  - 移除 ThemeToggle，仅支持 dark 主题
  - 文件：`src/components/layout/app-layout.tsx`

- [x] Task 23: 非空断言替换（P0-14）
  - 替换 page.tsx 中 3 处 mood_score! 为类型守卫（已在 Task 10 中同步完成）
  - 文件：`src/app/(main)/page.tsx`

- [x] Task 24: supervise-user-detail 接入 API（P1-01）
  - 移除硬编码 mock 数据，接入 supervise/records/goals API
  - 文件：`src/app/(main)/supervise-user-detail/page.tsx`

- [x] Task 25: 统一数据获取方式（P1-02）
  - goals、supervise 改为 useFetch Hook
  - 文件：`goals/page.tsx`、`supervise/page.tsx`

- [x] Task 26: 移动端管理员入口（P1-04）
  - MobileBottomNav 根据 role 动态显示 supervise/gateway 入口
  - 文件：`src/components/layout/mobile-bottom-nav.tsx`

- [x] Task 27: alert() 替换为 Toast（P1-05）
  - 安装 sonner，替换 3 处 alert() 调用
  - 文件：`record-form/page.tsx`、`goal-actions.tsx`、`record-actions.tsx`

- [x] Task 28: 删除未使用导入（P1-06）
  - 删除 5 个文件中的未使用导入
  - 文件：5 个页面文件

## 性能优化组

- [x] Task 29: cacheDel KEYS → SCAN（P0-17）
  - 改用 SCAN 命令避免阻塞 Redis
  - 文件：`src/lib/cache.ts`

- [x] Task 30: 清理未使用依赖（P1-15）
  - 移除 8 个非 Radix 包 + 23 个未使用 @radix-ui 包
  - 文件：`package.json`

- [x] Task 31: 删除未使用 UI 组件（P1-16）
  - 删除 44 个未使用的 shadcn/ui 组件文件
  - 文件：`src/components/ui/` 下 44 个文件

- [x] Task 32: 图表组件 memo 化（P1-17）
  - heatmap、radar-chart、trend-chart 添加 React.memo 和 useMemo
  - 文件：`src/components/charts/`

- [x] Task 33: 动态导入 recharts（P1-18）
  - 图表组件使用 next/dynamic 动态导入，SSR 禁用
  - 文件：`src/app/(main)/page.tsx`

- [x] Task 34: Supabase 客户端复用（P1-19）
  - getSupabaseClient 添加 Map 缓存（TTL 1小时）
  - 文件：`src/storage/database/supabase-client.ts`

## 基础设施组

- [x] Task 35: 创建 .env.example（P0-21）
  - 列出所有环境变量及说明
  - 文件：`.env.example`

- [x] Task 36: 集成 Sentry 错误追踪（P0-22）
  - 安装 @sentry/nextjs，配置 client/server/edge 端
  - 文件：`sentry.client.config.ts`、`sentry.server.config.ts`、`sentry.edge.config.ts`、`src/instrumentation.ts`

- [x] Task 37: 消除 getCurrentUser 重复（P1-13）
  - 抽取到 `src/lib/auth-server.ts`
  - 文件：`src/lib/auth-server.ts`（新建）、`src/lib/data/records.ts`、`src/lib/data/goals.ts`

- [x] Task 38: 配置 Husky + lint-staged + commitlint（P1-20）
  - 安装依赖，配置 pre-commit、commit-msg hooks
  - 文件：`.husky/`、`.lintstagedrc`、`commitlint.config.js`

- [x] Task 39: 添加 Prettier（P1-21）
  - 安装 prettier + eslint-config-prettier，创建 .prettierrc
  - 文件：`.prettierrc`、`package.json`

- [x] Task 40: 创建 Dockerfile（P1-22）
  - 多阶段构建（deps → builder → runner）
  - 文件：`Dockerfile`

- [x] Task 41: 创建 CI/CD 流水线（P1-23）
  - GitHub Actions workflow：install → lint → build
  - 文件：`.github/workflows/ci.yml`

- [x] Task 42: 实现优雅关闭（P1-24）
  - server.ts 处理 SIGTERM/SIGINT，10 秒超时强制关闭
  - 文件：`src/server.ts`

- [x] Task 43: 添加 /api/health 端点（P1-25）
  - 检查数据库和 Redis 连接状态
  - 文件：`src/app/api/health/route.ts`

# Task Dependencies

- 所有 43 个任务已完成