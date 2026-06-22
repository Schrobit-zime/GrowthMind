"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AppLayout } from "@/components/layout/app-layout";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // 强制刷新 profile，确保角色正确
  useEffect(() => {
    if (!isLoading && user) {
      refreshProfile();
    }
  }, [isLoading, user, refreshProfile]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
