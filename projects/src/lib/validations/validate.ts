import { ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

/**
 * 验证请求体并返回解析后的数据
 * 验证失败时返回 400 响应，包含详细错误信息
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T | NextResponse> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "输入数据验证失败",
          details: formatZodErrors(result.error),
        },
        { status: 400 },
      );
    }
    return result.data;
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体格式无效，请提供有效的 JSON" },
      { status: 400 },
    );
  }
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}
