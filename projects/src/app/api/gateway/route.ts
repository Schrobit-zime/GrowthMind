import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";

interface GatewayRequest {
  provider: "deepseek" | "openai" | "claude" | "zhipu";
  model?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

const providerConfigs: Record<string, { baseUrl: string; defaultModel: string; apiKeyEnv: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat", apiKeyEnv: "DEEPSEEK_API_KEY" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini", apiKeyEnv: "OPENAI_API_KEY" },
  claude: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-3-haiku-20240307", apiKeyEnv: "ANTHROPIC_API_KEY" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash", apiKeyEnv: "ZHIPU_API_KEY" },
};

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body: GatewayRequest = await request.json();

    if (!body.provider || !body.messages) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 });
    }

    const config = providerConfigs[body.provider];
    if (!config) {
      return NextResponse.json({ success: false, error: "不支持的模型厂商" }, { status: 400 });
    }

    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      return NextResponse.json({ success: false, error: `${body.provider} API Key 未配置` }, { status: 500 });
    }

    const model = body.model || config.defaultModel;
    const stream = body.stream ?? true;

    const fetchBody: Record<string, unknown> = {
      model,
      messages: body.messages,
      stream,
      temperature: body.temperature ?? 0.7,
    };
    if (body.max_tokens) fetchBody.max_tokens = body.max_tokens;

    const endpoint = body.provider === "claude"
      ? `${config.baseUrl}/messages`
      : `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (body.provider === "claude") {
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
        { provider: body.provider, status: response.status }
      );
    }

    if (stream) {
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
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
