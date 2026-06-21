"use client";

import React, { useMemo } from "react";
import { CHART_COLORS } from "./chart-theme";

interface HeatmapDataItem {
  date: string;
  value: number;
}

interface HeatmapProps {
  data: HeatmapDataItem[];
  columns?: number;
  color?: string;
}

/** 获取颜色深浅 - 根据 value 映射透明度 */
function getColorIntensity(value: number, maxValue: number, baseColor: string): string {
  if (value === 0) return "rgba(255,255,255,0.05)";
  const ratio = value / Math.max(maxValue, 1);
  if (ratio >= 0.8) return `${baseColor}90`;
  if (ratio >= 0.5) return `${baseColor}50`;
  if (ratio >= 0.2) return `${baseColor}25`;
  return `${baseColor}10`;
}

/** 日历热力图组件 */
const Heatmap = React.memo(function Heatmap({
  data,
  columns = 7,
  color = CHART_COLORS.primary,
}: HeatmapProps) {
  // 缓存计算密集型操作
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  const rows = useMemo(() => {
    const result: HeatmapDataItem[][] = [];
    for (let i = 0; i < data.length; i += columns) {
      result.push(data.slice(i, i + columns));
    }
    return result;
  }, [data, columns]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        暂无活跃度数据
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {data.map((item, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm transition-colors duration-200"
            style={{ backgroundColor: getColorIntensity(item.value, maxValue, color) }}
            title={`${item.date} · ${item.value}条记录`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-muted-foreground">少</span>
        <div className="flex gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorIntensity(0, 1, color) }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorIntensity(2, 5, color) }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorIntensity(5, 5, color) }}
          />
        </div>
        <span className="text-xs text-muted-foreground">多</span>
      </div>
    </div>
  );
});

export default Heatmap;
