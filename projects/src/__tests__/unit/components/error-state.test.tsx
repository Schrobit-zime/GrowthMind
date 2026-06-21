import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorState } from "@/components/shared/error-state";

describe("ErrorState 组件", () => {
  beforeEach(() => {
    cleanup();
  });

  it("应该渲染默认标题和消息", () => {
    render(<ErrorState />);
    expect(screen.getByText("加载失败")).toBeInTheDocument();
    expect(screen.getByText("请检查网络连接后重试")).toBeInTheDocument();
  });

  it("应该渲染自定义标题和消息", () => {
    render(
      <ErrorState
        title="自定义错误"
        message="自定义错误消息"
      />
    );
    expect(screen.getByText("自定义错误")).toBeInTheDocument();
    expect(screen.getByText("自定义错误消息")).toBeInTheDocument();
  });

  it("应该渲染重试按钮", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const button = screen.getByText("重试");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });

  it("无重试函数时不应渲染重试按钮", () => {
    render(<ErrorState />);
    expect(screen.queryByText("重试")).not.toBeInTheDocument();
  });

  it("应该渲染警告图标", () => {
    const { container } = render(<ErrorState />);
    const svg = container.querySelector("svg.lucide-triangle-alert");
    expect(svg).toBeInTheDocument();
  });

  it("应该应用自定义类名", () => {
    render(<ErrorState className="custom-class" />);
    const container = screen.getByText("加载失败").closest(".custom-class");
    expect(container).toBeInTheDocument();
  });
});