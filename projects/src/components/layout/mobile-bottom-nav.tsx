"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Brain,
  Target,
  Users,
  Server,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  highlight?: boolean;
}

const mobileNavItems: NavItem[] = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/records", label: "记录", icon: FileText },
  { href: "/record-form", label: "新增", icon: PlusCircle, highlight: true },
  { href: "/analysis", label: "分析", icon: Brain },
  { href: "/goals", label: "目标", icon: Target },
];

const adminMobileNavItems: NavItem[] = [
  { href: "/supervise", label: "监督", icon: Users },
  { href: "/gateway", label: "网关", icon: Server },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const navItems = isAdmin
    ? [...mobileNavItems, ...adminMobileNavItems]
    : mobileNavItems;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-border/20 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-12 min-w-[3rem] px-2 py-1 rounded-lg transition-colors ${
                item.highlight
                  ? "text-white"
                  : active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.highlight ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-float -mt-4">
                  <item.icon className="w-5 h-5" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
              {active && !item.highlight && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
