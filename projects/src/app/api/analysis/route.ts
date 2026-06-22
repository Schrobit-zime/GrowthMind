import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { analysisHistory } from "@/storage/database/shared/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

/** 分析请求体校验 */
const analysisBodySchema = z.object({
  timeRange: z.string().optional(),
  dimensions: z.array(z.string()).min(1, "请至少选择一个分析维度"),
  analysisType: z.string().optional(),
  records: z.array(z.unknown()).min(1, "该时间范围内暂无记录数据"),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 10;
    const data = await db
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.userId, auth.user.id))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取分析历史");
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = analysisBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "请求参数无效" },
        { status: 400 },
      );
    }

    const { timeRange, dimensions, analysisType, records } = parsed.data;

    const dimensionText = dimensions.join("、");
    const typeText =
      analysisType === "trend"
        ? "趋势分析"
        : analysisType === "assessment"
          ? "综合评估"
          : "优化建议";

    const systemPrompt = `你是 GrowthMind 个人成长分析助手。根据用户提供的${dimensionText}维度数据，进行${typeText}。请给出专业、具体、可操作的分析和建议。`;

    const userPrompt = `请分析以下成长数据：
时间范围：${timeRange}
分析维度：${dimensionText}
分析类型：${typeText}
记录数据：${JSON.stringify(records.slice(0, 20))}

请按以下结构输出：
1. 趋势解读
2. 状态评估（每个维度给出评级和说明）
3. 优化建议（3-5条具体建议）`;

    const gatewayUrl = `${request.nextUrl.origin}/api/gateway`;
    const gatewayResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session": request.headers.get("x-session") || "",
      },
      body: JSON.stringify({
        provider: "deepseek",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!gatewayResponse.ok) {
      throw new AppError(ErrorCode.AI_GATEWAY_ERROR, "AI 分析服务暂时不可用");
    }

    // 读取 SSE 流，累积内容并传递给客户端
    const reader = gatewayResponse.body!.getReader();
    const decoder = new TextDecoder();
    let accumulatedResult = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let lastChunkTime = Date.now();
          const TIMEOUT_MS = 30000;

          while (true) {
            if (Date.now() - lastChunkTime > TIMEOUT_MS) {
              controller.error(new Error("Stream timeout"));
              break;
            }
            const { done, value } = await reader.read();
            if (done) break;
            lastChunkTime = Date.now();
            const chunk = decoder.decode(value, { stream: true });
            accumulatedResult += chunk;
            controller.enqueue(value);
          }
          controller.close();

          // 在 SSE 流结束后写入分析历史
          await db.insert(analysisHistory).values({
            userId: auth.user.id,
            timeRange: body.timeRange || "custom",
            dimensions: body.dimensions || [],
            analysisType: body.analysisType || "general",
            result: accumulatedResult,
            modelUsed: "deepseek",
            tokensUsed: 0,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error, "AI 分析");
  }
}
