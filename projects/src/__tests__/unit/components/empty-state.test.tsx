import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState 组件", () => {
  beforeEach(() => {
    cleanup();
  });

  it("应该渲染标题", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });

  it("应该渲染描述", () => {
    render(<EmptyState title="暂无数据" description="请添加一些记录" />);
    expect(screen.getByText("请添加一些记录")).toBeInTheDocument();
  });

  it("应该渲染操作按钮", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="暂无数据"
        actionLabel="添加记录"
        onAction={onAction}
      />
    );

    const button = screen.getByText("添加记录");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAction).toHaveBeenCalled();
  });

  it("应该渲染自定义图标", () => {
    render(
      <EmptyState
        title="暂无数据"
        icon={<div data-testid="custom-icon">图标</div>}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("应该应用自定义类名", () => {
    render(<EmptyState title="暂无数据" className="custom-class" />);
    const container = screen.getByText("暂无数据").closest(".custom-class");
    expect(container).toBeInTheDocument();
  });

  it("无描述时不应渲染描述区域", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.queryByText(/请添加/)).not.toBeInTheDocument();
  });

  it("无操作按钮时不应渲染按钮", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});