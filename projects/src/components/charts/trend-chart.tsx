"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "./chart-theme";

interface TrendChartProps {
  data: Record<string, unknown>[];
  dataKeys: string[];
  xAxisKey: string;
  colors?: string[];
}

/** 自定义毛玻璃风 Tooltip */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 text-xs shadow-xl">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/80">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 趋势图组件 - 基于 Recharts AreaChart */
const TrendChart = React.memo(function TrendChart({
  data,
  dataKeys,
  xAxisKey,
  colors,
}: TrendChartProps) {
  const defaultColors = useMemo(() => [
    CHART_COLORS.primary,
    CHART_COLORS.accent,
    CHART_COLORS.rose,
  ], []);
  const lineColors = useMemo(() => colors || defaultColors, [colors, defaultColors]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        暂无趋势数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          {dataKeys.map((key, i) => (
            <linearGradient
              key={key}
              id={`trendGrad-${key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={lineColors[i % lineColors.length]}
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor={lineColors[i % lineColors.length]}
                stopOpacity="0"
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: "rgba(154, 167, 199, 0.6)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(154, 167, 199, 0.6)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip />} />
        {dataKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={lineColors[i % lineColors.length]}
            strokeWidth={2.5}
            fill={`url(#trendGrad-${key})`}
            dot={{
              r: 4,
              fill: lineColors[i % lineColors.length],
              stroke: "#070A14",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: lineColors[i % lineColors.length],
              stroke: "#070A14",
              strokeWidth: 2,
            }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default TrendChart;
