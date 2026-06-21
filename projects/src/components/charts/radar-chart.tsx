"use client";

import React from "react";
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "./chart-theme";

interface RadarDataItem {
  name: string;
  value: number;
}

interface RadarChartProps {
  data: RadarDataItem[];
  color?: string;
  maxValue?: number;
}

/** 自定义毛玻璃风 Tooltip */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RadarDataItem }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 text-xs shadow-xl">
      <p className="text-white/80">{item.name}</p>
      <p className="text-white font-medium">
        {(item.value * 100).toFixed(0)}%
      </p>
    </div>
  );
}

/** 五维雷达图组件 - 基于 Recharts RadarChart */
const RadarChartComponent = React.memo(function RadarChartComponent({
  data,
  color = CHART_COLORS.primary,
  maxValue = 1,
}: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        暂无雷达数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadar
        data={data}
        cx="50%"
        cy="50%"
        outerRadius="75%"
        margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
      >
        <PolarGrid
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: "rgba(154, 167, 199, 0.8)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxValue]}
          tick={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="综合评分"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.15}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
});

export default RadarChartComponent;
