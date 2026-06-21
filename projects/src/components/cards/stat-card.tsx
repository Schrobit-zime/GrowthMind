import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  href,
  className,
}: StatCardProps) {
  const trendIcon = {
    up: <ArrowUp className="w-4 h-4 text-emerald-400" />,
    down: <ArrowDown className="w-4 h-4 text-rose-400" />,
    flat: <Minus className="w-4 h-4 text-gray-400" />,
  };
  const content = (
    <Card
      className={`backdrop-blur-md bg-white/5 border-white/10 ${href ? "hover:bg-white/10 transition-all cursor-pointer" : ""} ${className || ""}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">{title}</span>
          {icon && <div className="text-[#7C5CFF]">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trendIcon[trend]}
            <span
              className={`text-xs ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-gray-400"}`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
