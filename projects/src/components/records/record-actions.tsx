"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface RecordActionsProps {
  recordId: string;
}

export function RecordActions({ recordId }: RecordActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!session?.access_token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
        headers: { "x-session": session.access_token },
      });
      const json = await res.json();
      if (json.success) {
        router.push("/records");
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
        <Link
          href={`/record-form?record_id=${recordId}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground bg-surface/40 backdrop-blur-xl border border-border/20 rounded-xl hover:bg-surface/60 transition-all"
        >
          <Edit className="w-4 h-4" /> 编辑
        </Link>
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-3 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-xl hover:bg-destructive/10 h-12"
        >
          <Trash2 className="w-4 h-4" /> 删除
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="backdrop-blur-2xl bg-white/5 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
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
