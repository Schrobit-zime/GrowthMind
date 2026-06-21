# 主题切换 — 添加暗色/亮色主题切换

## 项目上下文

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL)
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 根布局：`src/app/layout.tsx`（当前使用 `<html lang="zh-CN" className="dark">`，硬编码暗色主题）
- 全局样式：`src/app/globals.css`（当前仅定义 `.dark` 和 `:root` 的暗色变量，两者值完全相同）
- 页面布局：`src/components/layout/app-layout.tsx`（侧边栏+顶栏）
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 当前仅支持暗色主题
- next-themes 已安装（`"next-themes": "^0.4.6"`）但未使用

## 任务目标

使用已安装的 next-themes 为项目添加暗色/亮色主题切换，在顶栏添加切换按钮，保持毛玻璃风在两种主题下的视觉效果。

## 实施步骤

### 1. 读取关键文件了解当前结构

需要先读取以下文件：
- `src/app/layout.tsx` — 了解当前 `<html className="dark">` 硬编码
- `src/app/globals.css` — 了解当前 CSS 变量定义（`:root` 和 `.dark` 均为暗色值）
- `src/components/layout/app-layout.tsx` — 了解顶栏结构，确定主题切换按钮放置位置

### 2. 在 `src/app/globals.css` 中添加亮色主题 CSS 变量

当前 `:root` 和 `.dark` 定义的是相同的暗色变量。需要修改为：
- `:root` 定义亮色主题变量
- `.dark` 定义暗色主题变量（保持现有值不变）

修改后的 `globals.css`（只展示需要修改的 `:root` 和 `.dark` 部分，其余 `@theme` 和 `@layer` 保持不变）：

```css
/* :root 改为亮色主题变量 */
:root {
  --radius: 0.75rem;
  /* 亮色背景 */
  --background: #F5F7FA;
  --foreground: #1A1D2E;
  /* 亮色卡片 — 毛玻璃效果 */
  --card: rgba(255, 255, 255, 0.9);
  --card-foreground: #1A1D2E;
  --popover: rgba(255, 255, 255, 0.95);
  --popover-foreground: #1A1D2E;
  /* 主色保持不变 */
  --primary: #7C5CFF;
  --primary-foreground: #ffffff;
  /* 亮色次要色 */
  --secondary: rgba(0, 0, 0, 0.05);
  --secondary-foreground: #1A1D2E;
  --muted: rgba(0, 0, 0, 0.05);
  --muted-foreground: #6B7280;
  /* 强调色 */
  --accent: #69E7FF;
  --accent-foreground: #1A1D2E;
  /* 功能色 */
  --destructive: #E53E3E;
  --destructive-foreground: #ffffff;
  /* 亮色边框 */
  --border: rgba(0, 0, 0, 0.1);
  --input: rgba(0, 0, 0, 0.1);
  --ring: rgba(124, 92, 255, 0.4);
  /* 图表色 */
  --chart-1: #7C5CFF;
  --chart-2: #69E7FF;
  --chart-3: #62FAD3;
  --chart-4: #F5A623;
  --chart-5: #FF6B7A;
  /* 亮色侧边栏 */
  --sidebar: rgba(255, 255, 255, 0.8);
  --sidebar-foreground: #6B7280;
  --sidebar-primary: #7C5CFF;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(0, 0, 0, 0.05);
  --sidebar-accent-foreground: #1A1D2E;
  --sidebar-border: rgba(0, 0, 0, 0.08);
  --sidebar-ring: rgba(124, 92, 255, 0.4);
}

/* .dark 保持现有暗色变量不变 */
.dark {
  --radius: 0.75rem;
  --background: #070A14;
  --foreground: #F7FAFF;
  --card: rgba(255, 255, 255, 0.05);
  --card-foreground: #F7FAFF;
  --popover: rgba(255, 255, 255, 0.08);
  --popover-foreground: #F7FAFF;
  --primary: #7C5CFF;
  --primary-foreground: #ffffff;
  --secondary: rgba(255, 255, 255, 0.08);
  --secondary-foreground: #F7FAFF;
  --muted: rgba(255, 255, 255, 0.08);
  --muted-foreground: #9AA7C7;
  --accent: #69E7FF;
  --accent-foreground: #070A14;
  --destructive: #FF6B7A;
  --destructive-foreground: #ffffff;
  --border: rgba(255, 255, 255, 0.12);
  --input: rgba(255, 255, 255, 0.12);
  --ring: rgba(124, 92, 255, 0.4);
  --chart-1: #7C5CFF;
  --chart-2: #69E7FF;
  --chart-3: #62FAD3;
  --chart-4: #F5A623;
  --chart-5: #FF6B7A;
  --sidebar: rgba(255, 255, 255, 0.03);
  --sidebar-foreground: #9AA7C7;
  --sidebar-primary: #7C5CFF;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(255, 255, 255, 0.08);
  --sidebar-accent-foreground: #F7FAFF;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: rgba(124, 92, 255, 0.4);
}
```

### 3. 修改 `src/app/layout.tsx` 集成 ThemeProvider

需要先读取当前 `src/app/layout.tsx`（当前内容见项目上下文），添加 next-themes 的 ThemeProvider。

修改后的 layout.tsx：
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { SupabaseConfigProvider } from "@/components/auth/supabase-config-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "GrowthMind - 个人成长多维数据记录与智能分析平台",
  description:
    "记录学习、工作、生活、身体、心情等多维数据，AI 驱动趋势分析与优化建议",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SupabaseConfigProvider>
            <AuthProvider>{children}</AuthProvider>
          </SupabaseConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

关键变更：
- `<html>` 移除硬编码的 `className="dark"`，改为 `suppressHydrationWarning`
- 包裹 `ThemeProvider`（来自 shadcn/ui 标准模式，见下一步）
- `defaultTheme="dark"` 保持暗色为默认主题

### 4. 创建 `src/components/theme/theme-provider.tsx`

使用 next-themes 的标准 ThemeProvider 封装（shadcn/ui 风格）：

```typescript
// src/components/theme/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 5. 创建 `src/components/theme/theme-toggle.tsx`

主题切换按钮组件：

```tsx
// src/components/theme/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 避免 hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-surface-container animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-container transition-all duration-200"
      aria-label={theme === "dark" ? "切换到亮色主题" : "切换到暗色主题"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
```

### 6. 在 `src/components/layout/app-layout.tsx` 顶栏添加主题切换按钮

需要先读取当前 `src/components/layout/app-layout.tsx`，在顶栏的 header 中（新增记录按钮和头像菜单之间）添加 `<ThemeToggle />`。

修改位置（在 header 中，新增记录按钮之后）：
```tsx
import { ThemeToggle } from "@/components/theme/theme-toggle";

// 在 header 中，新增记录按钮之后，头像菜单之前添加：
<ThemeToggle />
```

### 7. 同步更新 `@theme` 中的 Tailwind 变量

在 `globals.css` 的 `@theme inline` 块中，需要将亮色背景变量也加入，确保 Tailwind CSS v4 的 utility class 能正确解析两种主题。由于 `@theme inline` 中的变量是静态的，而 `:root`/`.dark` 中的 CSS 变量是动态的，两者需要保持一致。

当前 `@theme inline` 中定义的是暗色值，这些值在亮色模式下可能不适用。建议将 `@theme inline` 中的颜色变量改为引用 CSS 变量（而非直接定义值），或者保留暗色默认值，因为 Tailwind 的 `dark:` 变体已通过 `@custom-variant dark (&:is(.dark *))` 处理。

> 实际上，由于 `:root` 中的 CSS 变量覆盖了 `@theme` 中的静态值，当前的架构已经可以正常工作。`@theme inline` 中的值仅作为 fallback。

### 8. 验证主题切换

```bash
cd /Users/jahangir/workspace/GrowthMind/projects
pnpm install
pnpm build
pnpm ts-check
```

验证清单：
- 页面默认加载暗色主题
- 点击主题切换按钮，切换为亮色主题
- 亮色主题下毛玻璃卡片效果正常（`rgba(255,255,255,0.9)` 背景）
- 亮色主题下文字可读（`#1A1D2E` 前景色）
- 主题切换按钮在两种主题下图标正确（暗色=太阳图标，亮色=月亮图标）
- 刷新页面后主题保持（localStorage 持久化）
- 无 hydration mismatch 警告

## 验收标准

- [ ] `src/app/globals.css` 中 `:root` 已定义亮色主题 CSS 变量
- [ ] `src/app/globals.css` 中 `.dark` 保持暗色主题 CSS 变量不变
- [ ] `src/components/theme/theme-provider.tsx` 创建完成
- [ ] `src/components/theme/theme-toggle.tsx` 创建完成，包含 hydration 安全处理
- [ ] `src/app/layout.tsx` 已集成 ThemeProvider，移除硬编码 className
- [ ] `src/components/layout/app-layout.tsx` 顶栏已添加 ThemeToggle 按钮
- [ ] 默认暗色主题显示正常
- [ ] 亮色主题下毛玻璃效果正常，文字可读
- [ ] 主题切换无闪烁，无 hydration mismatch 警告
- [ ] 刷新页面后主题保持
- [ ] `pnpm build` 构建成功
- [ ] `pnpm ts-check` 类型检查通过

## 预估工时

1 人天

## 依赖

无 — 全部可并行