# Tasks

- [x] Task 1: 全面复查认证链路和 loading 状态管理
  - 读取 src/app/layout.tsx 检查 Provider 嵌套顺序
  - 读取 src/components/auth/supabase-config-provider.tsx 检查 config 加载
  - 读取 src/components/auth/auth-provider.tsx 检查 isLoading 生命周期
  - 读取 src/lib/supabase-browser.ts 检查 waitForConfig 逻辑
  - 读取 src/proxy.ts 检查是否对 /login 有阻塞调用
  - 追踪：isLoading=true 后，所有能将其设为 false 的代码路径

- [x] Task 2: 复查所有页面组件的 loading/error 渲染逻辑
  - 读取 src/app/(main)/layout.tsx 检查认证守卫
  - 读取 src/app/(main)/page.tsx 检查主页 loading
  - 读取 src/app/(auth)/login/page.tsx 检查登录页 loading
  - 检查所有 useAuth() 消费者是否存在 isLoading 死锁

- [x] Task 3: 复查所有 API 路由的异常处理
  - 检查 /api/supabase-config 是否可能超时
  - 检查 /api/profile 是否可能 hang
  - 检查 /api/auth/set-cookie 是否可能失败导致前端 await 永远不返回
  - 检查所有路由是否有未 await 的 Promise

- [x] Task 4: 复查环境变量和配置
  - 检查 .env.local 是否存在且包含所有必需变量
  - 检查 getSupabaseCredentials() 的实现
  - 检查 proxy.ts 中 process.env.COZE_SUPABASE_URL 是否在 Edge Runtime 可用

- [x] Task 5: 生成详细 Markdown 报告
  - 将所有发现写入 trae/audit/08-转圈问题诊断与全面复查.md
  - 包含：根因分析、潜在 Bug 列表（P0-P3 分级）、修复建议、代码健康度评估

# Task Dependencies
- Task 5 depends on Task 1, 2, 3, 4
- Task 1, 2, 3, 4 可并行执行
