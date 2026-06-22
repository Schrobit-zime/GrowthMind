import { NextResponse } from "next/server";

/** GET /api/agent/v1 — 返回可用的 Agent API 端点列表和说明 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      name: "GrowthMind Agent API",
      version: "1.0.0",
      description: "面向 AI Agent 的个人成长多维数据读写接口",
      endpoints: {
        "GET /api/agent/v1": "获取 Agent API 端点列表和说明",
        "GET /api/agent/v1/records": "获取记录列表，支持 dimension、from、to、limit 参数",
        "POST /api/agent/v1/records": "创建新记录（简化字段）",
        "GET /api/agent/v1/goals": "获取目标列表",
        "POST /api/agent/v1/goals": "创建新目标",
        "GET /api/agent/v1/analysis/history": "获取分析历史",
        "POST /api/agent/v1/analysis": "执行 AI 分析（非流式，返回 JSON）",
        "GET /api/agent/v1/stats": "获取用户统计概览",
      },
      auth: {
        type: "bearer",
        header: "Authorization: Bearer <access_token>",
        note: "也支持 x-session header 和 sb-access-token cookie",
      },
    },
  });
}
