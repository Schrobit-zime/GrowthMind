# PWA 支持 — 添加离线访问和安装到桌面功能

## 项目上下文

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL)
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 根布局：`src/app/layout.tsx`（当前使用 `<html lang="zh-CN" className="dark">`，包含 SupabaseConfigProvider + AuthProvider）
- 全局样式：`src/app/globals.css`
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 当前仅支持暗色主题

## 任务目标

为 GrowthMind 添加 PWA（Progressive Web App）支持，实现离线访问和安装到桌面的功能。

## 实施步骤

### 1. 创建 `public/manifest.json`

```json
{
  "name": "GrowthMind - 个人成长多维数据记录与智能分析平台",
  "short_name": "GrowthMind",
  "description": "记录学习、工作、生活、身体、心情等多维数据，AI 驱动趋势分析与优化建议",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#070A14",
  "theme_color": "#7C5CFF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [],
  "categories": ["productivity", "lifestyle"],
  "lang": "zh-CN"
}
```

### 2. 创建 PWA 图标

需要在 `public/icons/` 目录下放置两个图标文件：
- `icon-192x192.png` — 192x192 像素
- `icon-512x512.png` — 512x512 像素

> 建议使用项目 Logo（带渐变背景的 Brain 图标），可以用 Figma 或在线工具生成。

### 3. 创建 `public/sw.js`（Service Worker）

```javascript
// public/sw.js
// GrowthMind Service Worker — 离线缓存策略

const CACHE_NAME = "growthmind-v1";
const STATIC_ASSETS = [
  "/",
  "/records",
  "/analysis",
  "/goals",
  "/manifest.json",
];

// 安装事件：预缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活事件：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：Network First 策略（静态资源缓存兜底）
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求和 API 请求
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 缓存成功的响应
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 离线时返回缓存
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response("离线模式", { status: 503 });
        });
      })
  );
});
```

### 4. 修改 `src/app/layout.tsx`

需要先读取当前 `src/app/layout.tsx`（当前内容见项目上下文），在 `<head>` 中添加 manifest 和 meta 标签。

修改后的 layout.tsx：
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { SupabaseConfigProvider } from "@/components/auth/supabase-config-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "GrowthMind - 个人成长多维数据记录与智能分析平台",
  description:
    "记录学习、工作、生活、身体、心情等多维数据，AI 驱动趋势分析与优化建议",
  // PWA manifest
  manifest: "/manifest.json",
  // iOS 适配
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GrowthMind",
  },
  // 主题色
  themeColor: "#7C5CFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* PWA Meta 标签 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GrowthMind" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#7C5CFF" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SupabaseConfigProvider>
          <AuthProvider>{children}</AuthProvider>
        </SupabaseConfigProvider>
      </body>
    </html>
  );
}
```

### 5. 注册 Service Worker

创建 `public/sw-register.js` 用于在客户端注册 Service Worker：

```javascript
// public/sw-register.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}
```

然后在 `src/app/layout.tsx` 的 `<head>` 中添加：
```tsx
<script src="/sw-register.js" defer />
```

### 6. 验证 PWA 功能

```bash
cd /Users/jahangir/workspace/GrowthMind/projects
pnpm build
pnpm start
```

验证清单：
- 使用 Chrome DevTools → Application → Manifest 检查 manifest.json 是否正确加载
- 使用 Chrome DevTools → Application → Service Workers 检查 SW 是否注册成功
- 使用 Lighthouse 进行 PWA 审计
- 在移动端 Chrome 中打开，检查是否出现"添加到主屏幕"提示
- 开启飞行模式测试离线访问

## 验收标准

- [ ] `public/manifest.json` 创建完成，包含正确的应用信息和图标配置
- [ ] `public/sw.js` 创建完成，实现 Network First 缓存策略
- [ ] `public/sw-register.js` 创建完成，在客户端注册 SW
- [ ] `src/app/layout.tsx` 已添加 manifest、meta 标签和 SW 注册脚本
- [ ] `public/icons/` 目录包含 192x192 和 512x512 图标
- [ ] PWA 图标与品牌色（#7C5CFF）一致
- [ ] `pnpm build` 构建成功
- [ ] Chrome DevTools 中 Manifest 和 Service Worker 正确加载
- [ ] 离线模式下静态页面可正常访问
- [ ] 移动端可"添加到主屏幕"，启动后以 standalone 模式运行

## 预估工时

1 人天

## 依赖

无 — 全部可并行