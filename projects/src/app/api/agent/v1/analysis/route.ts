import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { analysisHistory } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";
import { z } from "zod";

/** Agent 分析请求校验 */
const agentAnalysisSchema = z.object({
  timeRange: z.string().optional().default("7d"),
  dimensions: z.array(z.string()).min(1, "请至少选择一个分析维度"),
  analysisType: z.enum(["trend", "assessment", "suggestion"]).optional().default("assessment"),
});

/** GET /api/agent/v1/analysis/history — 获取分析历史列表 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "10"), 50);

    const data = await db
      .select({
        id: analysisHistory.id,
        timeRange: analysisHistory.timeRange,
        dimensions: analysisHistory.dimensions,
        analysisType: analysisHistory.analysisType,
        result: analysisHistory.result,
        modelUsed: analysisHistory.modelUsed,
        tokensUsed: analysisHistory.tokensUsed,
        createdAt: analysisHistory.createdAt,
      })
      .from(analysisHistory)
      .where(eq(analysisHistory.userId, auth.user.id))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "获取分析历史");
  }
}

/** POST /api/agent/v1/analysis — 执行 AI 分析（非流式，适合 Agent 调用） */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = agentAnalysisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "请求参数无效" },
        { status: 400 },
      );
    }

    const { timeRange, dimensions, analysisType } = parsed.data;
    const dimensionText = dimensions.join("、");

    const typeLabelMap: Record<string, string> = {
      trend: "趋势分析",
      assessment: "综合评估",
      suggestion: "优化建议",
    };
    const typeText = typeLabelMap[analysisType] || "综合评估";

    // 使用 fetch 调用内部 gateway，非流式模式
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
          {
            role: "system",
            content: `你是 GrowthMind 个人成长分析助手。根据用户提供的${dimensionText}维度数据，进行${typeText}。请给出专业、具体、可操作的分析和建议。`,
          },
          {
            role: "user",
            content: `请分析以下成长数据：\n时间范围：${timeRange}\n分析维度：${dimensionText}\n分析类型：${typeText}\n\n请按以下结构输出：\n1. 趋势解读\n2. 状态评估（每个维度给出评级和说明）\n3. 优化建议（3-5条具体建议）`,
          },
        ],
        stream: false,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!gatewayResponse.ok) {
      throw new AppError(ErrorCode.AI_GATEWAY_ERROR, "AI 分析服务暂时不可用");
    }

    const gatewayData = await gatewayResponse.json();

    // 从 gateway 响应中提取文字内容
    const resultText =
      gatewayData?.data?.choices?.[0]?.message?.content ||
      gatewayData?.data?.content?.[0]?.text ||
      "分析完成，但未获取到有效结果";

    const usage = gatewayData?.data?.usage || {};
    const tokensUsed = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

    // 保存分析历史
    const [saved] = await db
      .insert(analysisHistory)
      .values({
        userId: auth.user.id,
        timeRange,
        dimensions,
        analysisType,
        result: resultText,
        modelUsed: "deepseek",
        tokensUsed,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "AI 分析");
  }
}
