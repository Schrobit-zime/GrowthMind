# 2026-06-22 Bug 复查与稳定性修复

## 背景

本阶段基于项目现有 README、AGENTS 规范、历史审计报告和实际代码状态，对 GrowthMind 的认证、数据加载、智能分析、流式响应和管理权限链路进行了复查。复查过程中优先验证可导致转圈、误跳转、功能不可用或错误静默的问题。

## 修复内容

- 认证竞态：`AuthProvider` 在初始化、登录和 Token 刷新时等待 `/api/auth/set-cookie` 完成，避免前端会话已更新但 httpOnly cookie 尚未写入导致后续 API 请求 401。
- Profile 加载：`fetchProfile` 支持复用当前 access token，减少重复读取 Supabase session 带来的异步竞态。
- 智能分析链路：移除 `/api/gateway` POST 的管理员限制，使已登录用户可通过 `/api/analysis` 正常调用 AI 分析；保留 GET 状态接口的管理员校验。
- 流式超时：`/api/analysis`、`/api/gateway` 和 `useSSE` 增加真正能中断 `reader.read()` 的空闲/总超时保护，降低上游服务挂起时页面持续 loading 的风险。
- 错误展示：记录列表和智能分析页面对 `!res.ok` 或 `success:false` 的响应展示明确错误，不再误显示空数据或静默失败。
- 管理权限：监督关系列表、创建和用户搜索 API 增加服务端 admin 校验，并由 API 路由负责具体权限判断。
- 退出登录：退出后使用页面级替换跳转到登录页，降低客户端路由缓存导致的状态残留风险。

## 验证结果

- `pnpm ts-check`：通过。
- `pnpm lint:build`：通过。
- `pnpm test:run`：通过，7 个测试文件、36 个测试用例全部通过。

## 已知后续项

- `/api/admin/create-admin` 和 `/api/admin/set-admin` 仍建议在下一阶段增加更严格的初始化密钥、环境限制或管理员鉴权策略。
- 目标创建入口目前仍缺少完整表单页面，建议结合产品需求在后续迭代中补齐。
