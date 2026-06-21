"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/auth/auth-provider";

interface GoalActionsProps {
  goalId: string;
  goalName: string;
  currentValue: number;
  metric: string;
  relatedRecordsCount: number;
}

export function GoalActions({
  goalId,
  goalName,
  currentValue,
  metric,
  relatedRecordsCount,
}: GoalActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!session?.access_token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) {
        router.push("/goals");
      }
    } catch {
      toast.error("删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1 py-3 text-sm font-medium text-foreground backdrop-blur-md bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 h-12"
        >
          <Edit className="w-4 h-4" /> 编辑目标
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-3 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-xl hover:bg-destructive/10 h-12"
        >
          <Trash2 className="w-4 h-4" /> 删除目标
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="backdrop-blur-2xl bg-white/5 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除目标「{goalName}」吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs text-destructive">
              ⚠️ 关联的 {relatedRecordsCount} 条记录将保留但不再计入进度，
              {currentValue} {metric} 的进展不再关联此目标。
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="backdrop-blur-md bg-white/5 border-white/10 text-muted-foreground">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white"
            >
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
