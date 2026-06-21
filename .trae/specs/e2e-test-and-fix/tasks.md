# Tasks

- [x] Task 1: 修改 auth-provider.tsx - 使用 Next.js API 路由获取 profile
  - [x] SubTask 1.1: 修改 `fetchProfile` 方法，调用 `fetch("/api/profile?userId=xxx")` 替代 `supabase.from("profiles").select("*")`
  - [x] SubTask 1.2: 验证登录后 profile 正确加载

- [x] Task 2: 修改 middleware.ts - 使用 Drizzle 查询替代 PostgREST
  - [x] SubTask 2.1: 将中间件中 L70-74 的 `supabase.from("profiles").select("role")` 改为直接导入 `db` 和 `profiles` schema，使用 `db.select({ role: profiles.role }).from(profiles).where(eq(profiles.userId, userId))`
  - [x] SubTask 2.2: 移除中间件中对 `createClient` 的依赖（仅保留 auth.getUser）
  - [x] SubTask 2.3: 验证管理员路由权限控制正常

- [x] Task 3: 修改 export/route.ts - 使用 Drizzle 查询替代 PostgREST
  - [x] SubTask 3.1: 将 L29 的 `getSupabaseClient(auth.token)` 替换为导入 `db`
  - [x] SubTask 3.2: 将 L33-37 的 `db.from("records").select("*")` 改为 `db.select().from(schema.records).where(eq(schema.records.userId, userId))`
  - [x] SubTask 3.3: 将 L48-52 的 `db.from("goals").select("*")` 改为 `db.select().from(schema.goals).where(eq(schema.goals.userId, userId))`
  - [x] SubTask 3.4: 验证数据导出功能正常

- [x] Task 4: 浏览器自动化 E2E 测试 - 登录流程
  - [x] SubTask 4.1: 使用 agent-browser 打开 http://localhost:3001/login，截图验证页面元素
  - [x] SubTask 4.2: 输入 admin@growthmind.com / Admin123456 登录
  - [x] SubTask 4.3: 验证登录后跳转到 dashboard，截图记录

- [x] Task 5: 浏览器自动化 E2E 测试 - 核心功能
  - [x] SubTask 5.1: 测试成长记录页面（导航、列表、创建）
  - [x] SubTask 5.2: 测试目标管理页面
  - [x] SubTask 5.3: 测试数据分析页面
  - [x] SubTask 5.4: 测试侧边栏导航和页面切换

- [ ] Task 6: 修复测试中发现的问题
  - [ ] SubTask 6.1: 根据 E2E 测试结果修复所有发现的问题
  - [ ] SubTask 6.2: 重新测试验证修复

# Task Dependencies
- Task 1, 2, 3 无依赖，可并行执行
- Task 4 依赖 Task 1（登录后才能测试后续功能）
- Task 5 依赖 Task 4
- Task 6 依赖 Task 4 和 Task 5
