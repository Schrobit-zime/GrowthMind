import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { gatewayUsageLog } from "@/storage/database/shared/schema";
import { z } from "zod";

interface GatewayRequest {
  provider: "deepseek" | "openai" | "claude" | "zhipu";
  model?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/** 网关请求体校验 */
const gatewayBodySchema = z.object({
  provider: z.enum(["deepseek", "openai", "claude", "zhipu"]),
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ).min(1, "至少需要一条消息"),
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

const providerConfigs: Record<string, { baseUrl: string; defaultModel: string; apiKeyEnv: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat", apiKeyEnv: "DEEPSEEK_API_KEY" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini", apiKeyEnv: "OPENAI_API_KEY" },
  claude: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-3-haiku-20240307", apiKeyEnv: "ANTHROPIC_API_KEY" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash", apiKeyEnv: "ZHIPU_API_KEY" },
};

/** 简单成本计算函数：根据厂商和 token 数计算费用（美元） */
function calculateCost(provider: string, tokensIn: number, tokensOut: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    deepseek: { input: 0.00014, output: 0.00028 },
    openai: { input: 0.0015, output: 0.006 },
    anthropic: { input: 0.003, output: 0.015 },
  };
  const rate = rates[provider] || { input: 0, output: 0 };
  return parseFloat(((tokensIn * rate.input + tokensOut * rate.output) / 1000).toFixed(6));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body: GatewayRequest = await request.json();
    const parsed = gatewayBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "缺少必要参数" },
        { status: 400 }
      );
    }
    const validatedBody = parsed.data;

    const config = providerConfigs[validatedBody.provider];
    if (!config) {
      return NextResponse.json({ success: false, error: "不支持的模型厂商" }, { status: 400 });
    }

    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      return NextResponse.json({ success: false, error: `${validatedBody.provider} API Key 未配置` }, { status: 500 });
    }

    const model = validatedBody.model || config.defaultModel;
    const stream = validatedBody.stream ?? true;

    const fetchBody: Record<string, unknown> = {
      model,
      messages: validatedBody.messages,
      stream,
      temperature: validatedBody.temperature ?? 0.7,
    };
    if (validatedBody.max_tokens) fetchBody.max_tokens = validatedBody.max_tokens;

    const endpoint = validatedBody.provider === "claude"
      ? `${config.baseUrl}/messages`
      : `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (validatedBody.provider === "claude") {
      headers["anthropic-version"] = "2023-06-01";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(fetchBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(
        ErrorCode.AI_PROVIDER_ERROR,
        "AI 模型调用失败",
        { provider: validatedBody.provider, status: response.status }
      );
    }

    if (stream) {
      // 读取流式响应，累积内容并传递给客户端
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let promptTokens = 0;
      let completionTokens = 0;

      const outStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              accumulatedText += chunk;
              controller.enqueue(value);
            }
            controller.close();

            // 在流式响应完成后记录调用日志
            await db.insert(gatewayUsageLog).values({
              userId: auth.user.id,
              provider: validatedBody.provider,
              model: validatedBody.model || config.defaultModel,
              tokensIn: promptTokens,
              tokensOut: completionTokens,
              cost: calculateCost(validatedBody.provider, promptTokens, completionTokens),
              source: "api",
              createdAt: new Date().toISOString(),
            });
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new NextResponse(outStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    // 非流式响应：从响应中提取 token 用量
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    await db.insert(gatewayUsageLog).values({
      userId: auth.user.id,
      provider: validatedBody.provider,
      model: validatedBody.model || config.defaultModel,
      tokensIn: promptTokens,
      tokensOut: completionTokens,
      cost: calculateCost(validatedBody.provider, promptTokens, completionTokens),
      source: "api",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, "网关请求");
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      providers: Object.keys(providerConfigs),
      status: "operational",
      message: "Unified Model Gateway is running",
    },
  });
}
