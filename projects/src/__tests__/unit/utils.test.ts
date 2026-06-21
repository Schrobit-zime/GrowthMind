import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("合并基础类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("过滤假值", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("条件类名生效", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe(
      "base active"
    );
  });

  it("tailwind 冲突合并（twMerge）", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
  });

  it("空输入返回空字符串", () => {
    expect(cn()).toBe("");
  });

  it("数组输入", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
