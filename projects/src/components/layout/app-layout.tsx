"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Target,
  Users,
  Server,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus,
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // 确保仅在客户端渲染后使用 portal（避免 SSR 水合不匹配）
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = profile?.role === "admin";

  // Close avatar menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutConfirmOpen(false);
      router.push("/login");
    } catch {
      // 退出失败时重置状态，允许用户重试
      setSigningOut(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface/60 backdrop-blur-xl border-r border-border/20 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border/20">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-float">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">GrowthMind</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
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
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom user info */}
        <div className="p-3 border-t border-border/20">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.displayName || user?.email?.split("@")[0] || "用户"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? "管理员" : "普通用户"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden min-h-11 min-w-11 p-2 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          {/* New record button */}
          <Link
            href="/record-form"
            className="flex items-center gap-1.5 px-4 py-2 min-h-11 bg-gradient-to-r from-primary to-accent text-white text-sm font-medium rounded-lg shadow-float hover:shadow-glow transition-all duration-300 mx-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新增记录</span>
          </Link>

          {/* Avatar menu */}
          <div className="relative" ref={avatarMenuRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex items-center gap-2 p-1.5 min-h-11 rounded-lg hover:bg-surface-container transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  avatarMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface/90 backdrop-blur-xl border border-border/20 rounded-xl shadow-float py-1 z-50">
                <div className="px-4 py-2 border-b border-border/20">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.displayName || "用户"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    setSignOutConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 min-h-10 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>

      {/* Sign out confirmation modal — 使用 Portal 渲染到 body 层级，避免层叠上下文问题 */}
      {mounted &&
        signOutConfirmOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-surface/95 backdrop-blur-2xl border border-border/30 rounded-2xl p-6 w-full max-w-sm shadow-float">
              <h3 className="text-lg font-semibold text-foreground mb-2">确认退出</h3>
              <p className="text-sm text-muted-foreground mb-6">
                退出登录后需要重新登录才能访问应用
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSignOutConfirmOpen(false)}
                  className="px-4 py-2 min-h-10 text-sm font-medium text-muted-foreground hover:text-foreground bg-surface-container rounded-lg transition-colors inline-flex items-center"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="px-4 py-2 min-h-10 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {signingOut ? "退出中..." : "确认退出"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
