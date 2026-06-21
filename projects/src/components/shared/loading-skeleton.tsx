import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps { type?: "card" | "list" | "detail" | "dashboard"; count?: number; }
export function LoadingSkeleton({ type = "card", count = 3 }: LoadingSkeletonProps) {
  if (type === "dashboard") return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10"><Skeleton className="h-4 w-20 mb-3 bg-white/10" /><Skeleton className="h-8 w-16 mb-2 bg-white/10" /><Skeleton className="h-3 w-12 bg-white/10" /></div>))}
    </div>);
  if (type === "list") return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (<div key={i} className="rounded-xl p-4 backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full bg-white/10" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40 bg-white/10" /><Skeleton className="h-3 w-60 bg-white/10" /></div><Skeleton className="h-8 w-16 bg-white/10" /></div>))}
    </div>);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (<div key={i} className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10"><Skeleton className="h-4 w-24 mb-4 bg-white/10" /><Skeleton className="h-6 w-full mb-2 bg-white/10" /><Skeleton className="h-4 w-3/4 mb-4 bg-white/10" /><Skeleton className="h-8 w-full bg-white/10" /></div>))}
    </div>);
}
