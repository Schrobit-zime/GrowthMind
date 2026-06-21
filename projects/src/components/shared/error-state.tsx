import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
export function ErrorState({
  title = "加载失败",
  message = "请检查网络连接后重试",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className || ""}`}>
      <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="backdrop-blur-md bg-white/5 border-white/10 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </Button>
      )}
    </div>
  );
}
