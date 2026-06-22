# Tasks

- [x] Task 1: 修复 useFetch loading 死锁（P0-1, P0-2, P0-3）
  - ✅ `src/hooks/use-api.ts`：`fetchData` 开头检查 session，若为空则 `setState(p => ({...p, loading: false}))`（已就位）
  - ✅ `src/app/(main)/page.tsx`：两个 `useFetch` 添加 `enabled: !!session?.access_token`
  - ✅ `src/app/(main)/records/page.tsx`：`fetchRecords` 开头添加 `setLoading(false)`

- [x] Task 2: 添加客户端认证守卫（P0-4）
  - ✅ `src/app/(main)/layout.tsx`：已有完整认证守卫（useEffect 重定向 + loading spinner）

- [x] Task 3: 流式响应超时保护（P0-5）
  - ✅ `src/app/api/analysis/route.ts`：fetch 添加 `AbortSignal.timeout(30000)` + while 循环空闲超时
  - ✅ `src/app/api/gateway/route.ts`：fetch 添加 `AbortSignal.timeout(30000)` + while 循环空闲超时

- [x] Task 4: 验证修复效果
  - ✅ 重启 dev server 正常启动
  - ✅ 未登录访问 `/` → 客户端重定向到 `/login`
  - ✅ `/login` 返回 200
  - ✅ `/api/supabase-config` 返回配置数据

# Task Dependencies
- Task 4 depends on Task 1, 2, 3
- Task 1, 2, 3 可并行执行
