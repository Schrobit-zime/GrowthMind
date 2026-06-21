"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, Bell, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RuleItem {
  id: string;
  rule_type: string;
  condition: Record<string, unknown>;
  actions: string[];
  enabled: boolean;
}

const ruleTypeLabels: Record<string, string> = {
  no_record: "未记录提醒",
  goal_lagging: "目标滞后",
  mood_drop: "心情下降",
  custom: "自定义",
};

const actionLabels: Record<string, string> = {
  notify_admin: "通知管理员",
  notify_user: "通知用户",
  send_email: "发送邮件",
};

function RulesContent() {
  const { profile, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supervisedUserId = searchParams.get("user_id");
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.role !== "admin") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  const fetchRules = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const params = new URLSearchParams();
      if (supervisedUserId) params.set("supervised_user_id", supervisedUserId);
      const res = await fetch(`/api/supervise/rules?${params}`, {
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) setRules(json.data || []);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, supervisedUserId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/supervise/rules/${id}`, {
        method: "DELETE",
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) setRules(rules.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
    setShowDeleteConfirm(null);
  };

  const toggleRule = async (id: string, currentEnabled: boolean) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/supervise/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-session": session.access_token },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const json = await res.json();
      if (json.success) {
        setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !currentEnabled } : r)));
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  if (isLoading || profile?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-surface/40 backdrop-blur-xl border-b border-border/20">
        <Link href="/supervise" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-lg font-semibold text-foreground">提醒规则配置</span>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">提醒规则</h1>
            <p className="text-sm text-muted-foreground mt-1">为被监督用户设置智能提醒规则</p>
          </div>
          <Link href="/supervise-rules" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-medium rounded-xl shadow-float">
            <Plus className="w-4 h-4" /> 新增规则
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/5 border-white/10 text-center">
          <CardContent className="py-12">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">暂无提醒规则</p>
            <p className="text-xs text-muted-foreground">创建规则后，系统会在条件满足时自动触发提醒</p>
          </CardContent>
        </Card>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary">
                        {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${rule.enabled ? "bg-success/10 text-success" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                        {rule.enabled ? "已启用" : "已禁用"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      {typeof rule.condition === "object" && rule.condition !== null
                        ? JSON.stringify(rule.condition)
                        : "无条件"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.actions.map((action) => (
                        <span key={action} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-surface-container text-muted-foreground">
                          {action === "send_email" && <Mail className="w-3 h-3" />}
                          {action === "notify_admin" && <Bell className="w-3 h-3" />}
                          {action === "notify_user" && <User className="w-3 h-3" />}
                          {actionLabels[action] || action}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id, rule.enabled)} />
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(rule.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent className="backdrop-blur-2xl bg-white/5 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">删除规则</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条提醒规则吗？删除后该规则将不再触发。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="backdrop-blur-md bg-white/5 border-white/10 text-muted-foreground">取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="bg-destructive text-white">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SuperviseRulesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RulesContent />
    </Suspense>
  );
}
