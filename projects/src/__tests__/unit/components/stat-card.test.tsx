import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatCard } from "@/components/cards/stat-card";
import { Activity } from "lucide-react";

describe("StatCard 组件", () => {
  beforeEach(() => {
    cleanup();
  });

  it("应该渲染标题和数值", () => {
    render(<StatCard title="今日记录" value={12} unit="条" />);
    expect(screen.getByText("今日记录")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("条")).toBeInTheDocument();
  });

  it("应该渲染趋势图标", () => {
    render(
      <StatCard title="增长率" value="20" trend="up" trendValue="+20%相对于上周" />
    );
    expect(screen.getByText("+20%相对于上周")).toBeInTheDocument();
  });

  it("应该渲染图标", () => {
    render(
      <StatCard
        title="活跃度"
        value={85}
        icon={<Activity data-testid="activity-icon" />}
      />
    );
    expect(screen.getByTestId("activity-icon")).toBeInTheDocument();
  });

  it("无趋势时不应渲染趋势区域", () => {
    render(<StatCard title="总数" value={100} />);
    expect(screen.queryByText(/相对于/)).not.toBeInTheDocument();
  });

  it("应该渲染链接", () => {
    render(<StatCard title="详情" value="查看" href="/details" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/details");
  });

  it("应该应用自定义类名", () => {
    render(<StatCard title="测试" value="123" className="custom-class" />);
    const card = screen.getByText("测试").closest(".custom-class");
    expect(card).toBeInTheDocument();
  });
});