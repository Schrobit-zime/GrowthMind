"use client";

import { PieChart, Pie, ResponsiveContainer, Cell } from "recharts";
import { CHART_COLORS } from "./chart-theme";

interface ProgressRingProps {
  progress: number;
  label?: string;
  color?: string;
  size?: number;
}

/** 环形进度组件 - 基于 Recharts PieChart */
export default function ProgressRing({
  progress,
  label,
  color = CHART_COLORS.primary,
  size = 120,
}: ProgressRingProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const data = [
    { name: "进度", value: clampedProgress },
    { name: "剩余", value: 100 - clampedProgress },
  ];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            paddingAngle={2}
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">
          {clampedProgress}%
        </span>
        {label && (
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}
