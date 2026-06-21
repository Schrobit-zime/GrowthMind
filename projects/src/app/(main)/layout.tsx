"use client";

import { AppLayout } from "@/components/layout/app-layout";

/**
 * 主布局：认证检查已由 middleware 统一处理，无需客户端重复检查
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
