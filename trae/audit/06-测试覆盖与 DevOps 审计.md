# 测试覆盖与 DevOps 审计报告

> 审计目标：`/Users/jahangir/workspace/GrowthMind/projects`
> 审计日期：2026-06-22
> 审计范围：测试文件、测试基础设施、测试覆盖缺口、环境变量管理、部署配置、构建脚本、代码质量工具、部署就绪度
> 报告版本：v1.0

---

## 目录

1. [现有测试文件扫描](#1-现有测试文件扫描)
2. [测试基础设施评估](#2-测试基础设施评估)
3. [测试覆盖缺口分析](#3-测试覆盖缺口分析)
4. [环境变量管理](#4-环境变量管理)
5. [部署配置审查](#5-部署配置审查)
6. [构建脚本审查](#6-构建脚本审查)
7. [代码质量工具](#7-代码质量工具)
8. [部署就绪度评估](#8-部署就绪度评估)
9. [审计结论](#9-审计结论)

---

## 1. 现有测试文件扫描

### 1.1 测试文件清单

通过 Glob 扫描 `**/*.test.{ts,tsx}`、`**/*.spec.{ts,tsx}`、`__tests__/`、`e2e/` 目录，共发现 **9 个测试文件**（含 2 个测试辅助文件）。

| 类型 | 文件路径 | 测试框架 | 用例数 | 测试类型 |
|------|---------|---------|-------|---------|
| 单元测试 | `src/__tests__/unit/utils.test.ts` | vitest | 6 | 单元 |
| 单元测试 | `src/__tests__/unit/validations.test.ts` | vitest | 4 | 单元 |
| 单元测试 | `src/__tests__/unit/hooks/use-mobile.test.ts` | vitest | 4 | 单元 |
| 单元测试 | `src/__tests__/unit/components/empty-state.test.tsx` | vitest | 7 | 单元 |
| 单元测试 | `src/__tests__/unit/components/error-state.test.tsx` | vitest | 6 | 单元 |
| 单元测试 | `src/__tests__/unit/components/stat-card.test.tsx` | vitest | 6 | 单元 |
| 集成测试 | `src/__tests__/integration/records-api.test.ts` | vitest | 3 | 集成 |
| E2E 测试 | `e2e/auth.spec.ts` | playwright | 4 | E2E |
| E2E 测试 | `e2e/records.spec.ts` | playwright | 4 | E2E |
| 测试辅助 | `src/__tests__/helpers/test-factories.ts` | - | - | 工厂 |
| 测试辅助 | `src/__tests__/helpers/test-utils.tsx` | - | - | 工具 |

**测试用例总数：40 个**（单元测试 33 + 集成测试 3 + E2E 测试 8）

### 1.2 各测试文件详细分析

#### 1.2.1 `src/__tests__/unit/utils.test.ts`

- **测试目标**：`cn()` 类名合并工具函数（`src/lib/utils.ts`）
- **用例数**：6 个
- **覆盖功能**：基础合并、假值过滤、条件类名、tailwind 冲突合并、空输入、数组输入
- **断言完整性**：✅ 完整，使用 `expect().toBe()` 精确断言
- **Mock 使用**：无
- **质量评估**：优秀，覆盖了 `cn()` 的所有边界场景

#### 1.2.2 `src/__tests__/unit/validations.test.ts`

- **测试目标**：`validateBody()` 请求体校验函数（`src/lib/validations/validate.ts`）
- **用例数**：4 个
- **覆盖功能**：有效数据、无效数据、无效 JSON、错误信息详情
- **断言完整性**：✅ 完整，验证了返回值类型和错误结构
- **Mock 使用**：无
- **质量评估**：良好，但仅测试了通用 `validateBody`，未覆盖具体业务 schema（records/goals/supervise）

#### 1.2.3 `src/__tests__/unit/hooks/use-mobile.test.ts`

- **测试目标**：`useIsMobile` Hook（`src/hooks/use-mobile.ts`）
- **用例数**：4 个
- **覆盖功能**：返回类型、桌面宽度、移动端宽度、matchMedia 监听器注册
- **断言完整性**：✅ 完整
- **Mock 使用**：✅ 使用 `vi.stubGlobal` mock `matchMedia`
- **质量评估**：良好

#### 1.2.4 `src/__tests__/unit/components/empty-state.test.tsx`

- **测试目标**：`EmptyState` 组件（`src/components/shared/empty-state.tsx`）
- **用例数**：7 个
- **覆盖功能**：标题渲染、描述渲染、操作按钮、自定义图标、自定义类名、无描述时不渲染、无按钮时不渲染
- **断言完整性**：✅ 完整，使用 `getByText` / `queryByText` / `getByRole`
- **Mock 使用**：✅ 使用 `vi.fn()` mock 点击回调
- **质量评估**：优秀

#### 1.2.5 `src/__tests__/unit/components/error-state.test.tsx`

- **测试目标**：`ErrorState` 组件（`src/components/shared/error-state.tsx`）
- **用例数**：6 个
- **覆盖功能**：默认标题、自定义标题、重试按钮、无重试函数时不渲染、警告图标、自定义类名
- **断言完整性**：✅ 完整
- **Mock 使用**：✅ 使用 `vi.fn()` mock 重试回调
- **质量评估**：优秀

#### 1.2.6 `src/__tests__/unit/components/stat-card.test.tsx`

- **测试目标**：`StatCard` 组件（`src/components/cards/stat-card.tsx`）
- **用例数**：6 个
- **覆盖功能**：标题数值、趋势图标、自定义图标、无趋势时不渲染、链接渲染、自定义类名
- **断言完整性**：✅ 完整
- **Mock 使用**：无
- **质量评估**：良好

#### 1.2.7 `src/__tests__/integration/records-api.test.ts`

- **测试目标**：`/api/records` GET / POST 端点
- **用例数**：3 个
- **覆盖功能**：无认证返回 401、无效 token 返回 401、POST 无认证返回 401
- **断言完整性**：⚠️ 不完整，依赖运行的服务器（`isServerAvailable()`），服务器不可用时静默跳过
- **Mock 使用**：无，使用真实 HTTP 请求
- **质量评估**：⚠️ 较弱，仅测试了 401 场景，未测试成功路径、数据校验、CRUD 完整流程；依赖外部服务导致测试不稳定

#### 1.2.8 `e2e/auth.spec.ts`

- **测试目标**：认证流程
- **用例数**：4 个
- **覆盖功能**：登录页显示、未登录重定向、邮箱密码输入框、提交按钮
- **断言完整性**：✅ 完整
- **Mock 使用**：无
- **质量评估**：良好，但仅覆盖登录页 UI，未测试完整登录/登出流程

#### 1.2.9 `e2e/records.spec.ts`

- **测试目标**：页面可访问性
- **用例数**：4 个
- **覆盖功能**：登录页加载、标题、500 错误检查、静态资源加载
- **断言完整性**：✅ 完整
- **Mock 使用**：无
- **质量评估**：⚠️ 一般，文件名为 `records.spec.ts` 但实际测试的是登录页可访问性，与文件名不符

### 1.3 测试辅助文件

#### `src/__tests__/helpers/test-factories.ts`

提供 6 个测试数据工厂函数：`createTestUser`、`createTestRecord`、`createTestGoal`、`createTestAnalysis`、`createTestSupervise`、`createTestReminder`、`createTestGateway`。

⚠️ **问题**：工厂函数定义的字段与实际数据库 schema 不匹配。例如 `createTestRecord` 包含 `title`、`content`、`type`、`value`、`date`、`note` 字段，但实际 `records` 表使用 `timeDimension`、`recordDate`、`learning`、`work`、`life`、`health`、`mood`、`moodScore`、`summary`、`goalId` 字段。这导致工厂函数实际上无法使用。

#### `src/__tests__/helpers/test-utils.tsx`

提供自定义 `render` 函数，封装 `@testing-library/react` 的 `render` 和 `userEvent`。

⚠️ **问题**：自定义 `render` 未在任何测试文件中使用，所有组件测试都直接使用 `@testing-library/react` 的 `render`。

### 1.4 问题总结

1. **测试用例数量严重不足**：40 个用例覆盖 71 个组件 + 15 个 API 路由 + 12 个页面，覆盖率极低
2. **测试工厂与实际 schema 不匹配**：`test-factories.ts` 中的字段定义与数据库 schema 完全不一致，无法使用
3. **测试辅助文件未被使用**：`test-utils.tsx` 的自定义 `render` 未被任何测试引用
4. **集成测试依赖外部服务**：`records-api.test.ts` 依赖运行的服务器，导致测试不稳定
5. **E2E 测试命名与内容不符**：`records.spec.ts` 实际测试的是登录页
6. **关键业务逻辑无测试**：认证、数据 CRUD、AI 分析、监督、提醒引擎等核心功能均无测试

---

## 2. 测试基础设施评估

### 2.1 Vitest 配置（`vitest.config.ts`）

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**分析**：
- ✅ 测试环境为 `jsdom`，适合组件测试
- ✅ 路径别名 `@` 已配置
- ✅ setupFiles 引入 `vitest.setup.ts`
- ❌ **未配置覆盖率收集**（缺少 `coverage` 字段）
- ❌ **未配置覆盖率阈值**（无 `thresholds`）
- ❌ **未排除 e2e 目录**（虽然 include 模式不会匹配，但建议显式 exclude）
- ❌ **未配置 globals: true**，测试文件需显式 import `{ describe, it, expect }`

### 2.2 Vitest Setup（`vitest.setup.ts`）

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  notFound: vi.fn(),
}));
```

**分析**：
- ✅ Mock 了 `next/navigation` 的核心 API
- ❌ **未 Mock `next/headers`**（`cookies()`、`headers()` 在多个 API 数据层使用）
- ❌ **未 Mock `@/lib/db`**（数据库连接在测试环境会抛错）
- ❌ **未 Mock `@/lib/redis`**、`@/storage/database/supabase-client`
- ❌ **未引入 `@testing-library/jest-dom`** 自定义匹配器（虽然文件中 import 了，但未注册全局）

### 2.3 Playwright 配置（`playwright.config.ts`）

```typescript
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**分析**：
- ✅ 配置了 CI 环境的 retries 和 workers
- ✅ 配置了 trace on first retry
- ✅ webServer 自动启动
- ❌ **仅配置 chromium**，未覆盖 Firefox / WebKit / Mobile
- ❌ **baseURL 端口 3000 与实际启动端口 5000 不一致**（`scripts/start.sh` 使用 `PORT=5000`），会导致 webServer 探测失败
- ❌ **未配置截图失败策略**（`screenshot: "only-on-failure"`）
- ❌ **未配置视频录制策略**（`video: "on-first-retry"`）

### 2.4 TypeScript 配置（`tsconfig.json`）

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**分析**：
- ✅ 严格模式开启
- ❌ **未排除测试文件**（`**/*.test.ts` 会被编译，但 `noEmit: true` 缓解）
- ❌ **未排除 e2e 目录**，可能导致类型冲突
- ❌ **未配置 `types: ["vitest/globals", "@testing-library/jest-dom"]`**

### 2.5 测试脚本（`package.json`）

| 脚本 | 命令 | 评估 |
|------|------|------|
| `test` | `vitest` | ✅ watch 模式 |
| `test:run` | `vitest run` | ✅ 单次运行 |
| `test:coverage` | `vitest run --coverage` | ⚠️ 缺少 `@vitest/coverage-v8` 依赖 |
| `test:e2e` | `playwright test` | ✅ |
| `test:e2e:ui` | `playwright test --ui` | ✅ |
| `test:all` | `pnpm test:run && pnpm test:e2e` | ✅ |

**问题**：
- ❌ `test:coverage` 命令依赖 `@vitest/coverage-v8`，但 `package.json` 的 `devDependencies` 中未安装该包，运行会报错
- ❌ 没有 `pretest` / `posttest` 钩子
- ❌ CI 中没有集成测试脚本（无 `.github/workflows/`）

### 2.6 问题总结

1. **覆盖率配置缺失**：`vitest.config.ts` 未配置 `coverage`，无法量化测试覆盖率
2. **覆盖率工具未安装**：`@vitest/coverage-v8` 未在 devDependencies 中
3. **测试环境 mock 不完整**：`vitest.setup.ts` 未 mock `next/headers`、`@/lib/db` 等关键依赖
4. **Playwright 端口配置错误**：baseURL 3000 与实际启动端口 5000 不一致
5. **浏览器覆盖单一**：仅 chromium，未测试跨浏览器兼容性
6. **CI 集成缺失**：无 GitHub Actions / GitLab CI 配置

---

## 3. 测试覆盖缺口分析

### 3.1 项目结构概览

| 模块类型 | 总数 | 已测试 | 覆盖率 |
|---------|------|-------|-------|
| 页面（Pages） | 12 | 0 | 0% |
| API 路由 | 15 | 1（仅 401 场景） | ~7% |
| 业务组件 | 19 | 3 | ~16% |
| shadcn/ui 组件 | 52 | 0 | 0% |
| Hooks | 3 | 1 | 33% |
| Lib 工具 | 8+ | 2 | ~25% |
| 数据库 Schema | 8 张表 | 0 | 0% |
| 中间件 | 1 | 0 | 0% |

### 3.2 页面测试覆盖（0/12）

| 页面 | 文件路径 | 测试状态 | 优先级 |
|------|---------|---------|-------|
| 登录页 | `src/app/(auth)/login/page.tsx` | ❌ 无 | P0 |
| 首页/仪表盘 | `src/app/(main)/page.tsx` | ❌ 无 | P1 |
| 记录列表 | `src/app/(main)/records/page.tsx` | ❌ 无 | P0 |
| 记录录入 | `src/app/(main)/record-form/page.tsx` | ❌ 无 | P0 |
| 记录详情 | `src/app/(main)/record-detail/page.tsx` | ❌ 无 | P1 |
| 目标列表 | `src/app/(main)/goals/page.tsx` | ❌ 无 | P1 |
| 目标详情 | `src/app/(main)/goal-detail/page.tsx` | ❌ 无 | P1 |
| 智能分析 | `src/app/(main)/analysis/page.tsx` | ❌ 无 | P1 |
| 监督面板 | `src/app/(main)/supervise/page.tsx` | ❌ 无 | P2 |
| 监督用户详情 | `src/app/(main)/supervise-user-detail/page.tsx` | ❌ 无 | P2 |
| 监督规则 | `src/app/(main)/supervise-rules/page.tsx` | ❌ 无 | P2 |
| 模型网关 | `src/app/(main)/gateway/page.tsx` | ❌ 无 | P2 |

### 3.3 API 路由测试覆盖（1/15）

| API 路由 | 文件路径 | 测试状态 | 优先级 |
|---------|---------|---------|-------|
| `GET /api/supabase-config` | `src/app/api/supabase-config/route.ts` | ❌ 无 | P0 |
| `GET /api/records` | `src/app/api/records/route.ts` | ⚠️ 仅 401 | P0 |
| `POST /api/records` | `src/app/api/records/route.ts` | ⚠️ 仅 401 | P0 |
| `GET /api/records/[id]` | `src/app/api/records/[id]/route.ts` | ❌ 无 | P0 |
| `PUT /api/records/[id]` | `src/app/api/records/[id]/route.ts` | ❌ 无 | P0 |
| `DELETE /api/records/[id]` | `src/app/api/records/[id]/route.ts` | ❌ 无 | P0 |
| `GET /api/goals` | `src/app/api/goals/route.ts` | ❌ 无 | P0 |
| `POST /api/goals` | `src/app/api/goals/route.ts` | ❌ 无 | P0 |
| `GET /api/goals/[id]` | `src/app/api/goals/[id]/route.ts` | ❌ 无 | P1 |
| `PUT /api/goals/[id]` | `src/app/api/goals/[id]/route.ts` | ❌ 无 | P1 |
| `DELETE /api/goals/[id]` | `src/app/api/goals/[id]/route.ts` | ❌ 无 | P1 |
| `GET /api/profile` | `src/app/api/profile/route.ts` | ❌ 无 | P0 |
| `GET /api/analysis` | `src/app/api/analysis/route.ts` | ❌ 无 | P1 |
| `POST /api/analysis` | `src/app/api/analysis/route.ts` | ❌ 无 | P1 |
| `GET /api/gateway` | `src/app/api/gateway/route.ts` | ❌ 无 | P1 |
| `POST /api/gateway` | `src/app/api/gateway/route.ts` | ❌ 无 | P1 |
| `GET /api/export` | `src/app/api/export/route.ts` | ❌ 无 | P2 |
| `GET /api/supervise` | `src/app/api/supervise/route.ts` | ❌ 无 | P2 |
| `POST /api/supervise` | `src/app/api/supervise/route.ts` | ❌ 无 | P2 |
| `DELETE /api/supervise/[id]` | `src/app/api/supervise/[id]/route.ts` | ❌ 无 | P2 |
| `GET /api/supervise/rules` | `src/app/api/supervise/rules/route.ts` | ❌ 无 | P2 |
| `POST /api/supervise/rules` | `src/app/api/supervise/rules/route.ts` | ❌ 无 | P2 |
| `PUT /api/supervise/rules/[id]` | `src/app/api/supervise/rules/[id]/route.ts` | ❌ 无 | P2 |
| `DELETE /api/supervise/rules/[id]` | `src/app/api/supervise/rules/[id]/route.ts` | ❌ 无 | P2 |
| `GET /api/supervise/search` | `src/app/api/supervise/search/route.ts` | ❌ 无 | P2 |
| `GET /api/cron/check-reminders` | `src/app/api/cron/check-reminders/route.ts` | ❌ 无 | P1 |

### 3.4 组件测试覆盖（3/71）

| 组件类别 | 已测试 | 未测试关键组件 |
|---------|-------|--------------|
| `shared/` (8) | EmptyState, ErrorState | GlobalErrorBoundary, LoadingSkeleton, PageHeader, TagGroup, ThemeToggle, ExportButton |
| `cards/` (3) | StatCard | GoalCard, RecordCard |
| `auth/` (2) | - | AuthProvider, SupabaseConfigProvider |
| `charts/` (5) | - | Heatmap, ProgressRing, RadarChart, TrendChart, ChartTheme |
| `layout/` (2) | - | AppLayout, MobileBottomNav |
| `goals/` (1) | - | GoalActions |
| `records/` (1) | - | RecordActions |
| `ui/` (50) | - | 全部 shadcn/ui 组件（通常不需要测试，但关键组件如 Button、Input、Dialog 建议测试） |

### 3.5 Hooks 测试覆盖（1/3）

| Hook | 测试状态 |
|------|---------|
| `use-mobile.ts` | ✅ 已测试 |
| `use-api.ts` | ❌ 未测试 |
| `use-sse.ts` | ❌ 未测试 |

### 3.6 Lib 工具测试覆盖（2/8+）

| 模块 | 测试状态 | 优先级 |
|------|---------|-------|
| `lib/utils.ts` (cn) | ✅ 已测试 | - |
| `lib/validations/validate.ts` | ✅ 已测试 | - |
| `lib/validations/records.ts` | ❌ 未测试 | P0 |
| `lib/validations/goals.ts` | ❌ 未测试 | P0 |
| `lib/validations/supervise.ts` | ❌ 未测试 | P1 |
| `lib/errors.ts` (AppError, handleApiError) | ❌ 未测试 | P0 |
| `lib/cache.ts` | ❌ 未测试 | P1 |
| `lib/rate-limit.ts` | ❌ 未测试 | P0 |
| `lib/api-auth.ts` | ❌ 未测试 | P0 |
| `lib/db.ts` | ❌ 未测试 | P1 |
| `lib/redis.ts` | ❌ 未测试 | P1 |
| `lib/supabase-browser.ts` | ❌ 未测试 | P1 |
| `storage/database/supabase-client.ts` | ❌ 未测试 | P1 |
| `middleware.ts` | ❌ 未测试 | P0 |

### 3.7 关键业务逻辑测试覆盖

| 业务逻辑 | 测试状态 | 风险评估 |
|---------|---------|---------|
| 认证流程（登录/登出/会话刷新） | ❌ 无 | 🔴 高风险 |
| 数据 CRUD（records/goals） | ❌ 无 | 🔴 高风险 |
| 用户授权（admin 路由保护） | ❌ 无 | 🔴 高风险 |
| 输入校验（zod schemas） | ⚠️ 仅通用 validateBody | 🟡 中风险 |
| 速率限制 | ❌ 无 | 🟡 中风险 |
| 缓存读写 | ❌ 无 | 🟡 中风险 |
| AI 分析流式输出（SSE） | ❌ 无 | 🔴 高风险 |
| 模型网关多厂商路由 | ❌ 无 | 🔴 高风险 |
| 数据导出（CSV/PDF） | ❌ 无 | 🟡 中风险 |
| 监督关系管理 | ❌ 无 | 🟡 中风险 |
| 提醒规则引擎（cron） | ❌ 无 | 🔴 高风险 |
| 错误处理（AppError） | ❌ 无 | 🟡 中风险 |

### 3.8 测试补充清单（按优先级）

#### P0 — 必须立即补充（阻塞发布）

1. `lib/api-auth.ts` — `authenticateRequest` 单元测试（认证核心）
2. `lib/rate-limit.ts` — 速率限制单元测试（安全核心）
3. `lib/errors.ts` — `AppError` + `handleApiError` 单元测试
4. `lib/validations/records.ts` + `lib/validations/goals.ts` — 业务 schema 测试
5. `middleware.ts` — 路由守卫测试（admin 权限）
6. `app/api/records/route.ts` — 完整 CRUD 测试（mock db）
7. `app/api/goals/route.ts` — 完整 CRUD 测试（mock db）
8. `app/api/profile/route.ts` — 单元测试
9. `app/api/supabase-config/route.ts` — 单元测试
10. `app/(auth)/login/page.tsx` — 登录页组件测试

#### P1 — 短期内补充（1-2 周）

1. `app/api/analysis/route.ts` — SSE 流式输出测试
2. `app/api/gateway/route.ts` — 多厂商路由测试
3. `app/api/cron/check-reminders/route.ts` — 提醒引擎测试
4. `app/api/export/route.ts` — 导出功能测试
5. `components/auth/auth-provider.tsx` — 认证上下文测试
6. `hooks/use-api.ts` + `hooks/use-sse.ts` — Hook 测试
7. `lib/cache.ts` — 缓存测试
8. 关键页面组件测试（records、goals、analysis）

#### P2 — 中期补充（1 个月）

1. 监督相关 API + 页面测试
2. 图表组件测试（Heatmap、RadarChart、TrendChart、ProgressRing）
3. 布局组件测试（AppLayout、MobileBottomNav）
4. E2E 测试扩展（完整登录→创建记录→查看分析流程）

### 3.9 问题总结

1. **测试覆盖率极低**：估算整体覆盖率 < 5%，远低于生产级项目建议的 60-80%
2. **核心业务逻辑零覆盖**：认证、CRUD、授权、AI 分析等关键路径完全无测试
3. **测试金字塔失衡**：单元测试少，集成测试依赖外部服务，E2E 测试仅覆盖登录页
4. **测试工厂无法使用**：`test-factories.ts` 字段与实际 schema 不匹配
5. **P0 级测试缺口 10 项**：必须在发布前补充

---

## 4. 环境变量管理

### 4.1 环境变量清单

通过 Grep 搜索 `process.env.` 共发现 **14 个环境变量**使用点。

| 变量名 | 用途 | 敏感度 | 客户端可见 | 有默认值 | 使用位置 |
|--------|------|-------|----------|---------|---------|
| `COZE_SUPABASE_URL` | Supabase 项目 URL | 🟡 中 | ✅ 通过 `/api/supabase-config` 暴露 | ❌ 无 | `middleware.ts:32`, `supabase-client.ts:7,14,51`, `data/goals.ts:15`, `data/records.ts:15` |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名 Key | 🟡 中 | ✅ 通过 `/api/supabase-config` 暴露 | ❌ 无 | `middleware.ts:33`, `supabase-client.ts:7,14,52`, `data/goals.ts:16`, `data/records.ts:16` |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色 Key | 🔴 高 | ❌ 服务端 only | ❌ 无 | `supabase-client.ts:60` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `db.ts:6`, `drizzle.config.ts:8` |
| `REDIS_URL` | Redis 连接字符串 | 🔴 高 | ❌ 服务端 only | ❌ 无（缺失时禁用缓存） | `redis.ts:6,7,11` |
| `CRON_SECRET` | Cron 任务认证密钥 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `api/cron/check-reminders/route.ts:13` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `api/gateway/route.ts:15` (通过 `process.env[config.apiKeyEnv]`) |
| `OPENAI_API_KEY` | OpenAI API 密钥 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `api/gateway/route.ts:16` (通过 `process.env[config.apiKeyEnv]`) |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `api/gateway/route.ts:17` (通过 `process.env[config.apiKeyEnv]`) |
| `ZHIPU_API_KEY` | 智谱 API 密钥 | 🔴 高 | ❌ 服务端 only | ❌ 无 | `api/gateway/route.ts:18` (通过 `process.env[config.apiKeyEnv]`) |
| `NODE_ENV` | 运行环境标识 | 🟢 低 | ✅ | ❌ 无 | `errors.ts:81`, `redis.ts:7`, `api/cron/check-reminders/route.ts:14` |
| `COZE_PROJECT_ENV` | Coze 项目环境（PROD 判断） | 🟢 低 | ❌ | ❌ 无 | `server.ts:5,31` |
| `HOSTNAME` | 服务器主机名 | 🟢 低 | ❌ | ✅ `'localhost'` | `server.ts:6` |
| `PORT` | 服务器端口 | 🟢 低 | ❌ | ✅ `'5000'` | `server.ts:7` |

### 4.2 环境变量文档

❌ **缺失 `.env.example` / `.env.template` / `.env.local`**

项目根目录无任何环境变量示例文件，新开发者无法知道需要配置哪些环境变量。`.gitignore` 中已排除 `.env`、`.env.local` 等文件（第 13、14、107-110 行），但未提供模板。

### 4.3 运行时校验

❌ **无环境变量运行时校验**

通过 Grep 搜索 `z.object.*env|envSchema|validateEnv` 均无匹配。项目使用 `zod` 进行业务数据校验，但未对环境变量进行 schema 校验。

**问题示例**：
- `db.ts:6-7`：`const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error(...)` — 仅检查存在性，未校验格式
- `supabase-client.ts:51-55`：手动检查 `url` / `anonKey` 存在性，未校验 URL 格式
- `redis.ts:6-9`：缺失 `REDIS_URL` 时仅警告并禁用缓存，可能导致生产环境意外无缓存

### 4.4 敏感变量默认值泄露风险

✅ **无默认值泄露风险**

所有敏感环境变量（API Key、连接字符串、密钥）均无默认值，缺失时抛错或禁用功能。但存在以下问题：

- `supabase-client.ts:65`：`const key = token ? anonKey : (getSupabaseServiceRoleKey() ?? anonKey);` — 当服务角色 Key 缺失时回退到 anonKey，可能导致权限不足的 API 调用失败
- `api/cron/check-reminders/route.ts:14`：`if (process.env.NODE_ENV === "development") return true;` — 开发环境跳过 Cron 认证，若 NODE_ENV 误配置为 development，生产环境将暴露 Cron 端点

### 4.5 客户端环境变量暴露

⚠️ **`COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY` 通过 API 暴露给客户端**

`src/app/api/supabase-config/route.ts` 第 4-23 行：

```typescript
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseCredentials();
    if (!url || !anonKey) {
      return NextResponse.json({ error: "..." }, { status: 500 });
    }
    return NextResponse.json({ url, anonKey });
  } catch (error) { ... }
}
```

**问题**：
1. 该端点无认证保护（`middleware.ts:20` 显式跳过 `/api/supabase-config`）
2. 任何人都可以通过 `GET /api/supabase-config` 获取 Supabase URL 和 anonKey
3. 虽然anonKey设计上是公开的（受 RLS 保护），但暴露 URL 会让攻击者更容易进行针对性攻击
4. 未使用 `NEXT_PUBLIC_` 前缀（项目未使用），而是通过运行时 API 注入，增加了网络请求开销

**建议**：使用 `NEXT_PUBLIC_COZE_SUPABASE_URL` 和 `NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY` 在构建时注入，避免运行时 API 调用。

### 4.6 环境变量加载机制

`src/storage/database/supabase-client.ts:6-47` 实现了多级环境变量加载：

1. 优先检查 `process.env` 是否已有值
2. 尝试 `require('dotenv').config()` 加载 `.env` 文件
3. 回退到 Python `coze_workload_identity` SDK 获取项目环境变量

**问题**：
- 使用 `execSync` 同步执行 Python 子进程（第 32 行），阻塞 Node.js 事件循环
- `stdio: ['pipe', 'pipe', 'pipe']` 但未捕获 stderr，Python 错误会被静默吞掉（第 46 行 `catch { /* silent */ }`）
- 使用 `require` 而非 ES import，与项目 ESM 风格不一致

### 4.7 问题总结

1. **无 `.env.example` 模板**：新开发者无法快速配置环境
2. **无运行时校验**：环境变量缺失或格式错误只能在运行时发现
3. **Supabase 配置通过未认证 API 暴露**：存在信息泄露风险
4. **Cron 认证在开发环境跳过**：NODE_ENV 误配置会导致安全漏洞
5. **服务角色 Key 回退到 anonKey**：可能导致权限不足的静默失败
6. **Python 子进程同步加载**：阻塞事件循环，错误处理不完善
7. **环境变量分散使用**：14 个变量分布在 9 个文件中，无集中管理

---

## 5. 部署配置审查

### 5.1 部署配置文件扫描

通过 Glob 搜索以下文件均**未找到**：

| 文件类型 | 搜索模式 | 结果 |
|---------|---------|------|
| Dockerfile | `**/{Dockerfile,...}` | ❌ 不存在 |
| docker-compose | `**/{docker-compose*,...}` | ❌ 不存在 |
| vercel.json | `**/{...,vercel.json,...}` | ❌ 不存在 |
| netlify.toml | `**/{...,netlify.toml,...}` | ❌ 不存在 |
| GitHub Actions | `.github/workflows/**` | ❌ 不存在 |
| Makefile | `**/{...,Makefile}` | ❌ 不存在 |

### 5.2 部署脚本分析

项目通过 `scripts/` 目录下的 shell 脚本管理部署流程：

#### `scripts/build.sh`

```bash
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only
pnpm next build
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
```

**问题**：
- ❌ 无多阶段构建优化（install + build + bundle 在同一阶段）
- ❌ `--loglevel debug` 在生产构建中过于冗长
- ❌ 未清理 `.next` 缓存，可能导致增量构建污染
- ❌ `tsup` 输出 CJS 格式，与 Next.js 16 的 ESM 推荐不一致
- ❌ `--no-minify` 增大产物体积

#### `scripts/start.sh`

```bash
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"
PORT=${DEPLOY_RUN_PORT} node dist/server.js
```

**问题**：
- ❌ 硬编码 `PORT=5000`，与 `server.ts:7` 的默认值 `5000` 一致，但与 `playwright.config.ts:11` 的 `baseURL: "http://localhost:3000"` 不一致
- ❌ 无健康检查配置
- ❌ 无优雅关闭（graceful shutdown）机制
- ❌ 无进程管理（如 PM2、systemd），单点故障

#### `scripts/dev.sh`

```bash
PORT=${DEPLOY_RUN_PORT} pnpm tsx watch src/server.ts
```

包含端口冲突处理（`kill_port_if_listening` 函数），但使用 `ss` 命令在 macOS 上不可用（macOS 使用 `lsof`）。

#### `scripts/prepare.sh`

```bash
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only
if command -v coze > /dev/null 2>&1 && coze check-bins --help > /dev/null 2>&1; then
  coze check-bins --fix
fi
```

#### `scripts/validate.sh`

```bash
pnpm validate  # 即 pnpm run --parallel '/^(ts-check|lint:build)$/'
```

### 5.3 构建流程评估

**构建流程**：`install → next build → tsup bundle → node dist/server.js`

**问题**：
1. ❌ **无 Docker 容器化**：无法保证构建/运行环境一致性
2. ❌ **无 CI/CD 流水线**：所有构建部署手动执行
3. ❌ **无多阶段构建**：构建产物包含 devDependencies
4. ❌ **无健康检查端点**：虽然有 `healthCheck` 表，但无对应的 `/api/health` 路由
5. ❌ **无环境变量注入文档**：部署时不知道需要配置哪些变量
6. ❌ **无回滚机制**：部署失败无法快速回滚
7. ❌ **无蓝绿/金丝雀部署**：直接替换，停机时间不可控
8. ❌ **`scripts/dev.sh` 使用 `ss` 命令**：macOS 不兼容

### 5.4 静态资源优化

`next.config.ts` 配置：

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "coze-coding-project.tos.coze.site",
    }],
  },
};
```

**问题**：
- ❌ 未配置 `images.formats: ['image/avif', 'image/webp']` 现代图片格式
- ❌ 未配置 `compress: true`（默认开启，但建议显式）
- ❌ 未配置 `poweredByHeader: false`（安全建议）
- ❌ 未配置 `react.strictMode: true`
- ❌ 未配置 `experimental.optimizePackageImports` 优化大包
- ❌ 未配置静态资源缓存头

### 5.5 问题总结

1. **完全无容器化配置**：无 Dockerfile / docker-compose
2. **无 CI/CD 流水线**：无 GitHub Actions，部署完全手动
3. **无健康检查**：缺少 `/api/health` 端点
4. **无优雅关闭**：`server.ts` 未处理 `SIGTERM` / `SIGINT`
5. **构建脚本跨平台兼容性差**：`dev.sh` 使用 `ss` 命令，macOS 不支持
6. **Next.js 配置过于简单**：缺少性能优化和安全配置
7. **无部署文档**：新环境部署无指南

---

## 6. 构建脚本审查

### 6.1 package.json scripts 分析

```json
{
  "scripts": {
    "build": "bash ./scripts/build.sh",
    "dev": "bash ./scripts/dev.sh",
    "preinstall": "npx only-allow pnpm",
    "lint": "eslint",
    "lint:build": "eslint . --quiet",
    "start": "bash ./scripts/start.sh",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test:run && pnpm test:e2e",
    "ts-check": "tsc -p tsconfig.json",
    "validate": "pnpm run --parallel '/^(ts-check|lint:build)$/'",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 6.2 命令链分析

| 命令 | 链路 | 评估 |
|------|------|------|
| `dev` | `bash dev.sh` → `pnpm install` → `tsx watch src/server.ts` | ✅ HMR 模式 |
| `build` | `bash build.sh` → `pnpm install` → `next build` → `tsup bundle` | ⚠️ install 在 build 中重复执行 |
| `start` | `bash start.sh` → `node dist/server.js` | ✅ 生产启动 |
| `validate` | `pnpm run --parallel '/^(ts-check\|lint:build)$/'` | ✅ 并行执行 |
| `test:all` | `pnpm test:run && pnpm test:e2e` | ✅ 串行执行 |

### 6.3 Lint / Typecheck / Test 命令

| 命令 | 评估 |
|------|------|
| `lint` | ⚠️ `eslint` 无参数，可能扫描全项目包括 dist/ |
| `lint:build` | ✅ `eslint . --quiet` 适合 CI |
| `ts-check` | ✅ `tsc -p tsconfig.json` 标准类型检查 |
| `test` | ✅ vitest watch 模式 |
| `test:run` | ✅ vitest 单次运行 |
| `test:coverage` | ❌ 依赖未安装的 `@vitest/coverage-v8` |
| `test:e2e` | ✅ playwright 测试 |

### 6.4 Pre-commit / Pre-push Hooks

❌ **完全缺失**

- 无 `.husky/` 目录
- 无 `prepare` 脚本配置 husky
- 无 `lint-staged` 配置
- 无 `pre-commit` / `pre-push` 钩子

**影响**：代码可以在未通过 lint / typecheck / test 的情况下提交，质量无保障。

### 6.5 scripts/ 目录脚本文件

已在 5.2 节详细分析，此处补充：

| 脚本 | 用途 | 跨平台 | 错误处理 |
|------|------|-------|---------|
| `build.sh` | 生产构建 | ✅ bash 通用 | ✅ `set -Eeuo pipefail` |
| `dev.sh` | 开发启动 | ❌ 使用 `ss`（macOS 不兼容） | ✅ `set -Eeuo pipefail` |
| `start.sh` | 生产启动 | ✅ bash 通用 | ✅ `set -Eeuo pipefail` |
| `prepare.sh` | 安装准备 | ✅ bash 通用 | ✅ `set -Eeuo pipefail` |
| `validate.sh` | 校验 | ✅ bash 通用 | ✅ `set -Eeuo pipefail` |

### 6.6 问题总结

1. **无 Git Hooks**：husky / lint-staged / commitlint 全部缺失
2. **`test:coverage` 命令不可用**：缺少 `@vitest/coverage-v8` 依赖
3. **`dev.sh` 跨平台兼容性差**：使用 `ss` 命令，macOS 需改用 `lsof`
4. **`build.sh` 重复 install**：每次构建都执行 `pnpm install`，CI 中应分离
5. **`lint` 命令无参数**：可能扫描不必要的文件
6. **无 `prepublish` / `prepack` 钩子**：虽然项目是 private，但建议有保护

---

## 7. 代码质量工具

### 7.1 工具链完整性检查

| 工具 | 配置文件 | 状态 | 评估 |
|------|---------|------|------|
| ESLint | `eslint.config.mjs` | ✅ 存在 | ESLint 9 flat config，集成 next/typescript + core-web-vitals |
| Prettier | `.prettierrc*` | ❌ 不存在 | 未配置代码格式化 |
| Husky | `.husky/` | ❌ 不存在 | 未配置 Git Hooks |
| lint-staged | `.lintstagedrc` | ❌ 不存在 | 未配置暂存区 lint |
| commitlint | `commitlint.config.*` | ❌ 不存在 | 未配置提交信息规范 |
| Stylelint | `.stylelintrc*` | ❌ 不存在 | 未配置 CSS lint（Tailwind 项目可省略） |
| markdownlint | `.markdownlint*` | ❌ 不存在 | 未配置 Markdown lint |

### 7.2 ESLint 配置分析（`eslint.config.mjs`）

```javascript
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'react-hooks/set-state-in-effect': 'off',
      'no-restricted-syntax': ['error', ...syntaxRules],
    },
  },
  // next.config.ts 专用规则
  // globalIgnores
]);
```

**分析**：
- ✅ 使用 ESLint 9 flat config（最新规范）
- ✅ 集成 `eslint-config-next` 的 typescript + core-web-vitals
- ✅ 自定义规则：禁止 `<head>` 标签、禁止硬编码绝对路径
- ✅ 启用 `import/no-cycle` 防止循环依赖
- ⚠️ 关闭了 `react-hooks/set-state-in-effect` 规则
- ❌ 未配置 `@typescript-eslint/strict` 推荐规则
- ❌ 未配置 import 排序规则
- ❌ 未配置 React 19 相关规则
- ❌ 未集成 Prettier

### 7.3 代码格式化

❌ **未配置 Prettier**

项目无 `.prettierrc`、`.prettierignore`，`package.json` 中也无 `prettier` 字段。这导致：
- 代码风格依赖开发者手动维护
- ESLint 修复无法处理格式问题
- IDE 自动格式化无统一配置

### 7.4 Git Hooks

❌ **完全缺失**

- 无 `.husky/pre-commit`：提交前不执行 lint / format
- 无 `.husky/pre-push`：推送前不执行 test / typecheck
- 无 `.husky/commit-msg`：提交信息无规范校验

### 7.5 提交规范

❌ **未配置 commitlint**

项目无 Conventional Commits 规范，提交信息格式不统一。从 `git log` 角度无法自动生成 changelog。

### 7.6 代码质量工具链完整性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| Lint | 7/10 | ESLint 配置完善，但缺少部分严格规则 |
| Format | 0/10 | 完全缺失 Prettier |
| Hooks | 0/10 | 完全缺失 Husky |
| Commit | 0/10 | 完全缺失 commitlint |
| Type Check | 8/10 | TypeScript strict 模式 + tsc 检查 |

**综合评分：3/10** — 仅有基础 lint 和 typecheck，缺少格式化、hooks、提交规范。

### 7.7 问题总结

1. **Prettier 完全缺失**：代码格式无统一标准
2. **Git Hooks 完全缺失**：质量门禁无强制执行
3. **commitlint 缺失**：提交信息混乱，无法自动生成 changelog
4. **lint-staged 缺失**：每次 lint 扫描全项目，效率低
5. **ESLint 规则不够严格**：缺少 `@typescript-eslint/strict` 推荐

---

## 8. 部署就绪度评估

### 8.1 构建是否通过

⚠️ **无法确认**

- `package.json` 中 `build` 脚本依赖 `bash ./scripts/build.sh`
- `build.sh` 执行 `pnpm next build` + `pnpm tsup`
- 未在 CI 中验证构建，无法保证跨环境一致性
- `tsup` 输出 CJS 格式可能与 Next.js 16 ESM 要求冲突

**风险**：中。建议在干净环境执行 `pnpm build` 验证。

### 8.2 测试是否充分

❌ **严重不足**

- 测试覆盖率估算 < 5%
- 核心业务逻辑（认证、CRUD、AI 分析）无测试
- 集成测试依赖外部服务，不稳定
- 无 CI 自动执行测试
- 无覆盖率门槛

**风险**：极高。生产环境出问题无法快速发现。

### 8.3 环境变量是否完整

❌ **不完整**

- 无 `.env.example` 模板
- 无运行时校验
- 14 个环境变量分散在 9 个文件
- Supabase 配置通过未认证 API 暴露
- Cron 认证在开发环境跳过

**风险**：高。部署时极易遗漏环境变量配置。

### 8.4 监控和日志是否就绪

⚠️ **部分就绪**

**日志**：
- ✅ 使用 `console.error` / `console.log` 记录错误
- ✅ `lib/errors.ts` 统一错误处理 `handleApiError`
- ✅ `GlobalErrorBoundary` 捕获前端渲染错误
- ❌ 无结构化日志（JSON 格式）
- ❌ 无日志级别分类（debug/info/warn/error）
- ❌ 无日志收集系统（Logflare、Loki 等）
- ❌ 无请求 ID 追踪

**监控**：
- ❌ 无 APM（Application Performance Monitoring）
- ❌ 无指标收集（Prometheus、StatsD）
- ❌ 无健康检查端点
- ❌ 无就绪检查端点
- ❌ 无运行时性能监控

**风险**：高。生产问题无法及时发现和定位。

### 8.5 错误追踪是否配置

❌ **未配置**

通过 Grep 搜索 `sentry|Sentry|@sentry` 均无匹配。

- ❌ 无 Sentry 集成
- ❌ 无 Bugsnag / Rollbar / DataDog 错误追踪
- ❌ 无前端错误上报（仅 `console.error`）
- ❌ 无后端异常上报（仅 `console.error`）
- ❌ 无 Source Map 上传，生产错误堆栈无法还原

**风险**：极高。用户遇到的错误团队无法感知。

### 8.6 部署就绪度检查清单

| 检查项 | 状态 | 备注 |
|-------|------|------|
| 构建可重复 | ⚠️ | 依赖 bash 脚本，无容器化 |
| 构建可验证 | ❌ | 无 CI 自动构建 |
| 单元测试通过 | ⚠️ | 测试少但能通过 |
| 集成测试通过 | ❌ | 依赖外部服务 |
| E2E 测试通过 | ⚠️ | 端口配置不一致 |
| 覆盖率达标 | ❌ | < 5%，无阈值 |
| Lint 通过 | ✅ | ESLint 配置完善 |
| TypeCheck 通过 | ✅ | strict 模式 |
| 环境变量文档 | ❌ | 无 .env.example |
| 环境变量校验 | ❌ | 无运行时校验 |
| 健康检查 | ❌ | 无 /api/health |
| 就绪检查 | ❌ | 无 /api/ready |
| 优雅关闭 | ❌ | 未处理 SIGTERM |
| 日志收集 | ❌ | 仅 console |
| 错误追踪 | ❌ | 无 Sentry |
| 性能监控 | ❌ | 无 APM |
| 安全扫描 | ❌ | 无依赖审计 |
| 容器化 | ❌ | 无 Dockerfile |
| CI/CD | ❌ | 无 GitHub Actions |
| 回滚机制 | ❌ | 无 |
| 蓝绿部署 | ❌ | 无 |
| 文档完整 | ⚠️ | 有 README 但无部署文档 |

### 8.7 问题总结

1. **测试严重不足**：核心业务逻辑无测试保障
2. **无 CI/CD**：构建部署完全手动，易出错
3. **无错误追踪**：生产问题无法感知
4. **无监控**：性能、可用性无指标
5. **无健康检查**：负载均衡无法探测服务状态
6. **无容器化**：环境一致性无保障
7. **环境变量无文档**：部署易遗漏配置
8. **无优雅关闭**：部署期间请求丢失

---

## 9. 审计结论

### 9.1 测试与 DevOps 成熟度评分

| 维度 | 评分（1-10） | 说明 |
|------|------------|------|
| 测试覆盖率 | **2/10** | < 5% 覆盖率，核心逻辑零覆盖 |
| 测试基础设施 | **4/10** | vitest + playwright 已配置，但覆盖率、mock 不完整 |
| 测试质量 | **5/10** | 已有测试质量良好，但数量严重不足 |
| 环境变量管理 | **3/10** | 无文档、无校验、API 暴露 |
| 部署配置 | **2/10** | 无容器化、无 CI/CD、无健康检查 |
| 构建脚本 | **5/10** | 基本可用，但跨平台兼容性差 |
| 代码质量工具 | **3/10** | 仅有 ESLint，缺 Prettier/Husky/commitlint |
| 监控与日志 | **1/10** | 仅 console.log，无 APM/Sentry |
| 错误追踪 | **1/10** | 完全缺失 |
| 文档完整性 | **4/10** | 有 README/AGENTS.md，但无部署/测试文档 |

### 9.2 综合评分

## **综合成熟度评分：3/10**

### 9.3 成熟度等级

**等级：初始级（Initial）** — 类似 CMMI Level 1

- 测试和 DevOps 实践依赖个人，无组织级规范
- 流程不可重复，结果不可预测
- 质量保障依靠事后检查，无前置门禁
- 部署手动执行，无自动化

### 9.4 关键风险

1. **🔴 极高风险**：核心业务逻辑（认证、CRUD、AI 分析）无测试，生产故障无保障
2. **🔴 极高风险**：无错误追踪系统，用户问题无法感知
3. **🔴 极高风险**：无 CI/CD，部署易出错且无法回滚
4. **🟡 高风险**：环境变量无文档和校验，部署易遗漏
5. **🟡 高风险**：Supabase 配置通过未认证 API 暴露
6. **🟡 高风险**：无健康检查，负载均衡无法探测服务状态

### 9.5 改进路线图

#### 第一阶段（1-2 周）— 阻塞发布项

1. 创建 `.env.example` 环境变量模板
2. 补充 P0 级测试（认证、CRUD、授权、校验）
3. 安装 `@vitest/coverage-v8` 并配置覆盖率阈值
4. 修复 `vitest.setup.ts` mock 不完整问题
5. 修复 `playwright.config.ts` 端口不一致问题
6. 修复 `test-factories.ts` 与 schema 不匹配问题
7. 添加 `/api/health` 健康检查端点
8. 配置 Sentry 错误追踪

#### 第二阶段（2-4 周）— CI/CD 与质量门禁

1. 创建 `.github/workflows/ci.yml` CI 流水线
2. 配置 Husky + lint-staged + commitlint
3. 添加 Prettier 代码格式化
4. 创建 `Dockerfile` 多阶段构建
5. 补充 P1 级测试（AI 分析、网关、提醒引擎）
6. 实现优雅关闭（SIGTERM 处理）
7. 添加结构化日志

#### 第三阶段（1-2 月）— 监控与优化

1. 集成 APM（Vercel Analytics / DataDog）
2. 配置性能监控指标
3. 补充 P2 级测试（监督、图表、布局）
4. 扩展 E2E 测试覆盖完整用户流程
5. 实现蓝绿部署或金丝雀发布
6. 添加依赖安全扫描（Dependabot / Snyk）

### 9.6 部署建议

**当前状态：不建议直接部署到生产环境**

**最低发布要求**：
1. ✅ 完成 P0 级测试补充（至少 50 个新用例）
2. ✅ 创建 `.env.example` 并文档化所有环境变量
3. ✅ 配置 Sentry 错误追踪
4. ✅ 添加 `/api/health` 健康检查
5. ✅ 创建基础 CI 流水线（lint + typecheck + test）
6. ✅ 修复 Playwright 端口配置
7. ✅ 实现优雅关闭

完成以上最低要求后，预计成熟度评分可提升至 **6/10**，达到**可部署**级别。

---

> 报告生成完毕。本报告基于 2026-06-22 时的代码状态生成，共审计 9 个测试文件、14 个环境变量、5 个部署脚本、1 个 ESLint 配置，识别出 40+ 项问题，按优先级分类提供改进路线图。
