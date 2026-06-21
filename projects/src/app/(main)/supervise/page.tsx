"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Users, UserCheck, FileText, Bell, Search, X, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/cards/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

interface SupervisedUser {
  id: string;
  supervised_user_id: string;
  supervised?: { display_name?: string; avatar_url?: string } | null;
}

export default function SupervisePage() {
  const { profile, session, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<SupervisedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && profile?.role !== "admin") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/supervise", {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) setUsers(json.data || []);
    } catch (err) {
      console.error("Failed to fetch supervised users:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRemove = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/supervise/${id}`, {
        method: "DELETE",
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) {
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Failed to remove supervision:", err);
    }
    setShowRemoveConfirm(null);
  };

  if (isLoading || profile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    total: users.length,
    active: users.length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="监督面板" description="管理被监督用户，查看成长动态" />
        <Link href="/supervise-rules" className="flex items-center gap-2 px-4 py-2 bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl text-sm font-medium text-foreground hover:bg-surface/60 transition-all">
          <Bell className="w-4 h-4" /> 提醒规则
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "监督人数", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "活跃人数", value: stats.active, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "今日已记录", value: "—", icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "触发提醒", value: "—", icon: Bell, color: "text-rose-400", bg: "bg-rose-400/10" },
        ].map((s) => (
          <StatCard
            key={s.label}
            title={s.label}
            value={s.value}
            icon={
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            }
          />
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={3} />
      ) : users.length === 0 ? (
        <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="尚未监督任何用户"
            actionLabel="添加用户"
            onAction={() => setShowAddPanel(true)}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:bg-surface/60 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {(user.supervised?.display_name || user.supervised_user_id.slice(0, 2)).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">
                    {user.supervised?.display_name || `用户 ${user.supervised_user_id.slice(0, 8)}`}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">ID: {user.supervised_user_id.slice(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/supervise-user-detail?user_id=${user.supervised_user_id}`} className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                    查看详情
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setShowRemoveConfirm(user.id)} className="text-muted-foreground hover:text-destructive">
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="ghost" size="icon" onClick={() => setShowAddPanel(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-float hover:shadow-glow transition-all duration-300 hover:scale-105 z-40">
        <UserPlus className="w-6 h-6 text-white" />
      </Button>

      {showAddPanel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddPanel(false)} />
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 backdrop-blur-2xl border-t border-border/30 rounded-t-2xl p-6 z-50 shadow-float animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">添加监督用户</h3>
              <button onClick={() => setShowAddPanel(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索用户邮箱..." className="w-full pl-10 pr-4 py-3 bg-surface-container border-none rounded-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground text-center py-4">请输入用户邮箱或 ID 进行搜索</p>
          </div>
        </>
      )}

      <AlertDialog open={!!showRemoveConfirm} onOpenChange={(open) => !open && setShowRemoveConfirm(null)}>
        <AlertDialogContent className="backdrop-blur-2xl bg-white/5 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">解除监督</AlertDialogTitle>
            <AlertDialogDescription>
              确定要解除对该用户的监督吗？解除后你将无法查看其数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="backdrop-blur-md bg-white/5 border-white/10 text-muted-foreground">取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => showRemoveConfirm && handleRemove(showRemoveConfirm)} className="bg-destructive text-white">确认解除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
