# Checklist

## 安全修复验证
- [x] `/api/profile` 无法越权访问他人资料（P0-01）
- [x] Access Token Cookie 设置了 httpOnly + Secure + SameSite 属性（P0-03）
- [x] Middleware 管理员路由角色检查不依赖内部 fetch（P0-06）
- [x] Middleware catch 块对 API 请求返回 401（P0-07）
- [x] analysis_history、gateway_usage_log、email_templates、health_check 表已启用 RLS（P0-10）
- [x] `/login` 路由有速率限制（P0-18）
- [x] 限流使用 Redis 分布式存储（P0-19）
- [x] cron 任务始终验证 CRON_SECRET（P0-20）
- [x] Middleware 对所有受保护路由验证 token 有效性（P1-03 + P1-12）
- [x] 认证机制统一到 `src/lib/auth.ts`（P1-07）
- [x] 所有用户数据查询通过 Supabase 客户端携带 JWT，RLS 生效（P0-02）

## 数据/API 修复验证
- [x] 6 个页面接口字段已改为 camelCase（P0-04）
- [x] 数据库迁移文件包含关键索引（P0-05）
- [x] analysis POST 写入 analysisHistory 表（P0-08）
- [x] gateway POST 写入 gatewayUsageLog 表（P0-09）
- [x] check-reminders 使用批量查询，无 N+1 问题（P0-15）
- [x] 导出接口有 MAX_EXPORT_ROWS = 10000 限制（P0-16）
- [x] 所有 API 路由使用 handleApiError + Zod 校验（P1-08）
- [x] 所有 API 响应格式统一为 `{ success, data, error }`（P1-09）
- [x] 数据库迁移文件包含外键约束（P1-10）
- [x] check-reminders 无 any 类型使用（P1-14）

## 前端修复验证
- [x] 5 个页面有错误态展示（goals/records/supervise/supervise-rules/supervise-user-detail）（P0-11）
- [x] GlobalErrorBoundary 包裹 MainLayout children（P0-12）
- [x] 主题切换正常工作或仅支持 dark 主题（P0-13）
- [x] page.tsx 无非空断言（P0-14）
- [x] supervise-user-detail 使用真实 API 数据（P1-01）
- [x] 4 个页面统一使用 useFetch Hook（P1-02）
- [x] 移动端底部导航包含管理员入口（P1-04）
- [x] 无 alert() 调用，改用 sonner Toast（P1-05）
- [x] 无未使用的导入（P1-06）

## 性能优化验证
- [x] cacheDel 使用 SCAN 命令（P0-17）
- [x] 未使用依赖已从 package.json 移除（P1-15）
- [x] 未使用 shadcn/ui 组件文件已删除（P1-16）
- [x] 图表组件使用 React.memo + useMemo（P1-17）
- [x] recharts 图表使用 next/dynamic 动态导入（P1-18）
- [x] Supabase 客户端实例已缓存复用（P1-19）

## 基础设施验证
- [x] `.env.example` 文件存在且包含所有环境变量（P0-21）
- [x] Sentry 已集成（sentry.client.config.ts、sentry.server.config.ts、instrumentation.ts）（P0-22）
- [x] getCurrentUser 不再重复定义（P1-13）
- [x] `/api/health` 端点存在且正常工作（P1-25）
- [x] Husky hooks 配置完整（pre-commit、pre-push、commit-msg）（P1-20）
- [x] `.prettierrc` 文件存在（P1-21）
- [x] `Dockerfile` 多阶段构建存在（P1-22）
- [x] `.github/workflows/ci.yml` CI 流水线存在（P1-23）
- [x] server.ts 有 SIGTERM/SIGINT 优雅关闭（P1-24）
- [x] 僵尸表已处理（gateway_usage_log 已使用、email_templates 已删除或实现、health_check 已使用）（P1-11）

## 全局验证
- [x] `pnpm build` 构建通过，无类型错误
- [x] `pnpm lint` 通过，无 ESLint 错误
- [x] 所有修改的文件路径与审计报告一致
- [x] 无新增 console.log 打印敏感信息