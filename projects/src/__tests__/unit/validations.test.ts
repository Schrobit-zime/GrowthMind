import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateBody } from "@/lib/validations/validate";

describe("validateBody()", () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(0).max(120),
  });

  it("应该验证有效数据", async () => {
    const validData = { name: "John", email: "john@example.com", age: 25 };
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const result = await validateBody(request, testSchema);
    expect(result).toEqual(validData);
  });

  it("应该拒绝无效数据", async () => {
    const invalidData = { name: "", email: "invalid-email", age: -1 };
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const result = await validateBody(request, testSchema);
    expect(result).toBeInstanceOf(Response);
  });

  it("应该处理无效 JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "invalid json",
    });

    const result = await validateBody(request, testSchema);
    expect(result).toBeInstanceOf(Response);
  });

  it("应该返回详细的错误信息", async () => {
    const invalidData = { name: "", email: "invalid-email" };
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const result = await validateBody(request, testSchema);
    expect(result).toBeInstanceOf(Response);

    if (result instanceof Response) {
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("输入数据验证失败");
      expect(body.details).toBeDefined();
    }
  });
});
