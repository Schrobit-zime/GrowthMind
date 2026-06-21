import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { timeRange, dimensions, analysisType, records } = body;

    if (!dimensions || dimensions.length === 0) {
      return NextResponse.json(
        { success: false, error: "请至少选择一个分析维度" },
        { status: 400 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "该时间范围内暂无记录数据，请先记录后再进行分析" },
        { status: 400 }
      );
    }

    const dimensionText = dimensions.join("、");
    const typeText =
      analysisType === "trend" ? "趋势分析" :
      analysisType === "assessment" ? "综合评估" : "优化建议";

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
    });

    if (!gatewayResponse.ok) {
      throw new AppError(
        ErrorCode.AI_GATEWAY_ERROR,
        "AI 分析服务暂时不可用"
      );
    }

    return new NextResponse(gatewayResponse.body, {
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
