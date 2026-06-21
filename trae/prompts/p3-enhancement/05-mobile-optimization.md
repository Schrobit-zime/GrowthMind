# 移动端优化 — 优化移动端体验

## 项目上下文

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL)
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 页面布局：`src/components/layout/app-layout.tsx`（当前侧边栏在移动端使用 `-translate-x-full` 隐藏，通过顶栏汉堡菜单按钮切换 `sidebarOpen` 状态显示，有黑色半透明遮罩层）
- 典型页面：
  - 仪表盘：`src/app/(main)/page.tsx`（grid 布局 `grid-cols-2 lg:grid-cols-4`，使用 `p-4 lg:p-6`）
  - 记录列表：`src/app/(main)/records/page.tsx`（使用 `p-4 lg:p-6`，有固定底部 FAB 按钮 `fixed bottom-6 right-6`）
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 当前仅支持暗色主题
- 使用 shadcn/ui 组件库（已安装 `@radix-ui/react-dialog`、`vaul` 等）

## 任务目标

优化 GrowthMind 在移动端（< 768px）的使用体验，包括底部导航栏、Sheet 侧边栏抽屉、触摸交互优化和表单移动端适配。

## 实施步骤

### 1. 读取关键文件了解当前实现

需要先读取以下文件：
- `src/components/layout/app-layout.tsx` — 了解当前侧边栏实现和响应式策略
- `src/app/(main)/page.tsx` — 仪表盘页面，了解当前响应式布局
- `src/app/(main)/records/page.tsx` — 记录列表页面，了解当前响应式布局
- `src/app/(main)/record-form/page.tsx` — 记录表单页面（如存在）

### 2. 创建底部导航栏组件 `src/components/layout/mobile-bottom-nav.tsx`

移动端底部导航栏，替代侧边栏的主导航功能：

```tsx
// src/components/layout/mobile-bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Target,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/records", label: "记录", icon: FileText },
  { href: null, label: "新增", icon: Plus, isAction: true },
  { href: "/analysis", label: "分析", icon: Brain },
  { href: "/goals", label: "目标", icon: Target },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (href: string | null) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-border/20 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <Link
                key="add"
                href="/record-form"
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-float active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg transition-colors active:bg-surface-container ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 3. 创建移动端侧边栏抽屉组件 `src/components/layout/mobile-sidebar-sheet.tsx`

使用 shadcn/ui 的 Sheet 组件（底层使用 `vaul` 或 `@radix-ui/react-dialog`）实现移动端侧边栏抽屉：

```tsx
// src/components/layout/mobile-sidebar-sheet.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { MobileSidebarNav } from "./mobile-sidebar-nav";

interface MobileSidebarSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebarSheet({ open, onClose }: MobileSidebarSheetProps) {
  const pathname = usePathname();

  // 路由变化时关闭
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 抽屉面板 */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface/95 backdrop-blur-2xl border-r border-border/20 shadow-float animate-in slide-in-from-left duration-300">
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/20">
          <span className="text-lg font-bold text-foreground">GrowthMind</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <MobileSidebarNav />
      </div>
    </div>
  );
}
```

### 4. 创建移动端侧边栏导航内容 `src/components/layout/mobile-sidebar-nav.tsx`

```tsx
// src/components/layout/mobile-sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Target,
  Users,
  Server,
} from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/records", label: "记录列表", icon: FileText },
  { href: "/analysis", label: "智能分析", icon: Brain },
  { href: "/goals", label: "目标管理", icon: Target },
];

const adminNavItems = [
  { href: "/supervise", label: "监督面板", icon: Users },
  { href: "/gateway", label: "模型网关", icon: Server },
];

export function MobileSidebarNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
            isActive(item.href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground active:bg-surface-container"
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {item.label}
        </Link>
      ))}

      {isAdmin && (
        <>
          <div className="pt-3 pb-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              管理员
            </span>
          </div>
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground active:bg-surface-container"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
```

### 5. 修改 `src/components/layout/app-layout.tsx`

需要先读取当前文件，进行以下修改：

1. 导入新组件
2. 在页面内容底部添加 `<MobileBottomNav />`
3. 为移动端调整主内容区域的 padding（底部留出导航栏空间）

```tsx
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileSidebarSheet } from "./mobile-sidebar-sheet";

// 在 main 内容区域添加底部 padding（移动端给底部导航栏留空间）
// 将 <main className="flex-1 overflow-y-auto">
// 改为 <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
// 并在 main 之后添加：
// <MobileBottomNav />
```

同时，将现有的移动端侧边栏实现替换为 `MobileSidebarSheet` 组件。

### 6. 优化触摸交互

在全局样式或页面中应用以下触摸优化：

```css
/* 在 globals.css 中添加 */
@layer base {
  /* 增大移动端点击区域 */
  @media (max-width: 767px) {
    button, a, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* 移除 iOS 点击高亮 */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* iOS 安全区域适配 */
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}
```

### 7. 移动端表单优化

修改 `src/app/(main)/record-form/page.tsx`（如存在）中的输入框，确保在移动端全宽显示：

```tsx
// 输入框添加移动端全宽样式
className="w-full px-4 py-3 bg-surface-container border-none rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
```

如果页面使用 `max-w-7xl` 等限制宽度的容器，确保在移动端不使用 `max-w` 限制。

### 8. 验证移动端体验

```bash
cd /Users/jahangir/workspace/GrowthMind/projects
pnpm install
pnpm build
pnpm ts-check
```

在 Chrome DevTools 的移动端模拟器中测试：
- iPhone SE (375px)
- iPhone 12/13 (390px)
- Pixel 5 (393px)
- iPad (768px+)

## 验收标准

- [ ] `src/components/layout/mobile-bottom-nav.tsx` 创建完成
- [ ] `src/components/layout/mobile-sidebar-sheet.tsx` 创建完成
- [ ] `src/components/layout/mobile-sidebar-nav.tsx` 创建完成
- [ ] `src/components/layout/app-layout.tsx` 已集成底部导航栏和 Sheet 抽屉
- [ ] 移动端 (< 768px) 底部导航栏显示，5 个核心入口（仪表盘/记录/新增/分析/目标）
- [ ] 新增按钮在底部导航栏中突出显示（`-mt-5` 上浮效果）
- [ ] 点击汉堡菜单打开 Sheet 侧边栏抽屉，路由变化后自动关闭
- [ ] 触摸交互：点击区域 ≥ 44x44px，无 iOS 点击高亮，active 状态反馈
- [ ] 表单输入框在移动端全宽显示
- [ ] 页面底部有 `pb-16` 为底部导航栏留空间
- [ ] 桌面端 (> 768px) 不受影响，侧边栏和顶栏正常显示
- [ ] `pnpm build` 构建成功
- [ ] `pnpm ts-check` 类型检查通过

## 预估工时

2 人天

## 依赖

无 — 全部可并行