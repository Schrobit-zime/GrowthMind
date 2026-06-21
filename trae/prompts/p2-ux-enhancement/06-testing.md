# P2-06: 测试体系建设

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。
- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 核心页面（都在 `src/app/(main)/`）：
  - `page.tsx` — 仪表盘（~400行，含手写 SVG 图表和 Mock 数据）
  - `records/page.tsx` — 记录列表
  - `record-form/page.tsx` — 记录录入（~400行）
  - `record-detail/page.tsx` — 记录详情
  - `goals/page.tsx` — 目标列表
  - `goal-detail/page.tsx` — 目标详情
  - `analysis/page.tsx` — 智能分析
  - `supervise/page.tsx` — 监督面板（~280行）
  - `supervise-user-detail/page.tsx` — 被监督用户详情
  - `supervise-rules/page.tsx` — 提醒规则（~300行）
  - `gateway/page.tsx` — 模型网关（~270行）
- UI 组件目录：`src/components/ui/`（60+ shadcn/ui 组件已安装但几乎未使用）
- 已安装但未使用的关键依赖：recharts, react-hook-form, zod, sonner, next-themes
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 全局样式：`src/app/globals.css`
- 错误边界：`src/app/error.tsx`、`src/app/not-found.tsx`、`src/app/(main)/error.tsx`
- 加载态：`src/app/(main)/loading.tsx`

## 任务目标

建立完整的测试体系，包括单元测试（Vitest + Testing Library）、集成测试（API Routes）、E2E 测试（Playwright），确保核心功能质量。

## 实施步骤

### 步骤 1：安装测试依赖

```bash
cd /Users/jahangir/workspace/GrowthMind/projects/
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
pnpm add -D @playwright/test
pnpm add -D @vitest/coverage-v8
```

### 步骤 2：配置 Vitest

创建 `vitest.config.ts`：

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境：jsdom 模拟浏览器 DOM
    environment: "jsdom",
    // 测试文件匹配模式
    include: ["src/**/*.test.{ts,tsx}"],
    // 全局 setup 文件
    setupFiles: ["./vitest.setup.ts"],
    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/components/ui/**",
      ],
    },
    // 路径别名（与 tsconfig.json 保持一致）
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

创建 `vitest.setup.ts`：

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";

// Mock Next.js 的 useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  notFound: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
    themes: ["light", "dark"],
  }),
}));
```

### 步骤 3：配置 Playwright

创建 `playwright.config.ts`：

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 步骤 4：创建测试目录结构

```
src/__tests__/
├── unit/
│   ├── utils.test.ts          # 工具函数测试
│   └── components/
│       ├── stat-card.test.tsx  # 卡片组件测试
│       ├── empty-state.test.tsx
│       └── error-state.test.tsx
├── integration/
│   ├── records-api.test.ts     # 记录 API 测试
│   └── goals-api.test.ts      # 目标 API 测试
└── helpers/
    └── test-utils.tsx          # 测试工具函数

e2e/
├── auth.spec.ts                # 认证流程测试
├── records.spec.ts             # 记录创建与查看
└── goals.spec.ts               # 目标管理
```

### 步骤 5：编写单元测试

#### 工具函数测试 `src/__tests__/unit/utils.test.ts`

```ts
// src/__tests__/unit/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() 工具函数", () => {
  it("应该合并多个类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("应该处理条件类名", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("应该处理空输入", () => {
    expect(cn()).toBe("");
  });

  it("应该处理 undefined 和 null", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("应该处理 Tailwind 类名冲突（合并）", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
```

#### 组件测试示例 `src/__tests__/unit/components/stat-card.test.tsx`

```tsx
// src/__tests__/unit/components/stat-card.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/cards/stat-card";
import { Activity } from "lucide-react";

describe("StatCard 组件", () => {
  it("应该渲染标题和数值", () => {
    render(<StatCard title="今日记录" value={12} unit="条" />);
    expect(screen.getByText("今日记录")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("条")).toBeInTheDocument();
  });

  it("应该渲染趋势图标", () => {
    render(
      <StatCard title="增长率" value="20" trend="up" trendValue="+20%相对于上周" />
    );
    expect(screen.getByText("+20%相对于上周")).toBeInTheDocument();
  });

  it("应该渲染图标", () => {
    render(
      <StatCard
        title="活跃度"
        value={85}
        icon={<Activity data-testid="activity-icon" />}
      />
    );
    expect(screen.getByTestId("activity-icon")).toBeInTheDocument();
  });

  it("无趋势时不应渲染趋势区域", () => {
    render(<StatCard title="总数" value={100} />);
    expect(screen.queryByText(/相对于/)).not.toBeInTheDocument();
  });
});
```

#### 测试工具函数 `src/__tests__/helpers/test-utils.tsx`

```tsx
// src/__tests__/helpers/test-utils.tsx
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

// 自定义渲染函数，包裹必要的 Provider
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { ...options });
}

// 重新导出所有 testing-library 工具
export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";
```

### 步骤 6：编写集成测试

#### API Route 测试 `src/__tests__/integration/records-api.test.ts`

```ts
// src/__tests__/integration/records-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// 注意：需要先启动 Supabase 本地开发环境或使用 Mock
const BASE_URL = "http://localhost:3000";

describe("Records API", () => {
  describe("GET /api/records", () => {
    it("应该返回记录列表", async () => {
      const response = await fetch(`${BASE_URL}/api/records`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("应该支持分页参数", async () => {
      const response = await fetch(`${BASE_URL}/api/records?page=1&limit=10`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeLessThanOrEqual(10);
    });
  });

  describe("POST /api/records", () => {
    it("缺少必填字段时应该返回 400", async () => {
      const response = await fetch(`${BASE_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("应该成功创建记录", async () => {
      const response = await fetch(`${BASE_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mood",
          value: 8,
          date: "2026-06-21",
          note: "测试记录",
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id");
    });
  });
});
```

### 步骤 7：编写 E2E 测试

#### 用户登录→创建记录→查看列表流程 `e2e/records.spec.ts`

```ts
// e2e/records.spec.ts
import { test, expect } from "@playwright/test";

test.describe("记录管理流程", () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("应该完成创建记录→查看列表完整流程", async ({ page }) => {
    // 1. 导航到记录录入页面
    await page.click("text=新建记录");
    await page.waitForURL("/record-form");

    // 2. 填写表单
    await page.selectOption('select[name="type"]', "mood");
    await page.fill('input[name="value"]', "8");
    await page.fill('textarea[name="note"]', "今天心情不错");
    await page.click('button[type="submit"]');

    // 3. 验证跳转到记录列表
    await page.waitForURL("/records");
    await expect(page.getByText("记录已保存")).toBeVisible();

    // 4. 验证新记录在列表中
    await expect(page.getByText("今天心情不错")).toBeVisible();
  });
});
```

#### 认证流程测试 `e2e/auth.spec.ts`

```ts
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("认证流程", () => {
  test("未登录用户应该重定向到登录页", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("应该显示登录表单", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("邮箱")).toBeVisible();
    await expect(page.getByLabel("密码")).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("输入错误凭据应该显示错误信息", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/登录失败|账号或密码错误/)).toBeVisible();
  });
});
```

### 步骤 8：配置 package.json 脚本

在 `package.json` 中添加测试脚本：

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test:run && pnpm test:e2e"
  }
}
```

### 步骤 9：创建 CI 测试配置（可选）

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage

  e2e:
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 代码示例

### 测试文件命名规范

| 测试类型 | 文件位置 | 命名格式 |
|---------|---------|---------|
| 单元测试 | `src/__tests__/unit/` | `*.test.ts` / `*.test.tsx` |
| 集成测试 | `src/__tests__/integration/` | `*.test.ts` |
| E2E 测试 | `e2e/` | `*.spec.ts` |

### 测试编写原则

1. **AAA 模式**：Arrange（准备）→ Act（执行）→ Assert（断言）
2. **一个测试一个关注点**：每个 `it()` 只测试一个行为
3. **描述性命名**：`it("应该在输入为空时禁用提交按钮")`
4. **避免测试实现细节**：测试行为而非内部状态
5. **Mock 外部依赖**：网络请求、认证、主题等

## 验收标准

- [ ] 测试依赖已安装（vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @vitejs/plugin-react, @playwright/test, @vitest/coverage-v8）
- [ ] `vitest.config.ts` 已创建，包含 jsdom 环境、路径别名、覆盖率配置
- [ ] `vitest.setup.ts` 已创建，包含 testing-library 匹配器、Next.js mock
- [ ] `playwright.config.ts` 已创建，包含 Chromium 项目、baseURL 配置
- [ ] `src/__tests__/unit/` 目录已创建，包含至少 2 个单元测试文件
- [ ] `src/__tests__/integration/` 目录已创建，包含至少 1 个 API 测试文件
- [ ] `src/__tests__/helpers/test-utils.tsx` 已创建
- [ ] `e2e/` 目录已创建，包含至少 2 个 E2E 测试文件
- [ ] `package.json` 已添加 test、test:run、test:coverage、test:e2e、test:all 脚本
- [ ] 单元测试：`cn()` 工具函数测试通过
- [ ] 单元测试：`StatCard` 组件测试通过（如果 P2-03 已创建）
- [ ] 集成测试：`/api/records` GET/POST 端点测试通过
- [ ] E2E 测试：用户登录→创建记录→查看列表流程通过
- [ ] E2E 测试：认证流程测试通过
- [ ] 运行 `pnpm test:run` 所有单元测试通过
- [ ] 运行 `pnpm test:e2e` 所有 E2E 测试通过（需本地服务运行）
- [ ] 通过 `pnpm typecheck` 类型检查

## 预估工时

2 人天

## 依赖

无（可与其他 P2 任务并行执行）