import { NextResponse } from "next/server";

export enum ErrorCode {
  UNKNOWN = "UNKNOWN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  DB_ERROR = "DB_ERROR",
  DB_UNIQUE_VIOLATION = "DB_UNIQUE_VIOLATION",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  AI_GATEWAY_ERROR = "AI_GATEWAY_ERROR",
  AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR",
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
  GOAL_NOT_FOUND = "GOAL_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  SUPERVISION_NOT_FOUND = "SUPERVISION_NOT_FOUND",
  RULE_NOT_FOUND = "RULE_NOT_FOUND",
  ALREADY_SUPERVISED = "ALREADY_SUPERVISED",
}

const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.UNKNOWN]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.DB_UNIQUE_VIOLATION]: 409,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.AI_GATEWAY_ERROR]: 502,
  [ErrorCode.AI_PROVIDER_ERROR]: 502,
  [ErrorCode.RECORD_NOT_FOUND]: 404,
  [ErrorCode.GOAL_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.SUPERVISION_NOT_FOUND]: 404,
  [ErrorCode.RULE_NOT_FOUND]: 404,
  [ErrorCode.ALREADY_SUPERVISED]: 409,
};

const PRODUCTION_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN]: "服务器内部错误，请稍后重试",
  [ErrorCode.VALIDATION_ERROR]: "请求参数无效",
  [ErrorCode.NOT_FOUND]: "请求的资源不存在",
  [ErrorCode.UNAUTHORIZED]: "请先登录",
  [ErrorCode.FORBIDDEN]: "权限不足",
  [ErrorCode.CONFLICT]: "资源冲突，请检查后重试",
  [ErrorCode.RATE_LIMITED]: "请求过于频繁，请稍后重试",
  [ErrorCode.DB_ERROR]: "数据操作失败，请稍后重试",
  [ErrorCode.DB_UNIQUE_VIOLATION]: "数据已存在，请勿重复操作",
  [ErrorCode.EXTERNAL_API_ERROR]: "外部服务暂时不可用，请稍后重试",
  [ErrorCode.AI_GATEWAY_ERROR]: "AI 服务暂时不可用，请稍后重试",
  [ErrorCode.AI_PROVIDER_ERROR]: "AI 模型服务暂时不可用，请稍后重试",
  [ErrorCode.RECORD_NOT_FOUND]: "记录不存在",
  [ErrorCode.GOAL_NOT_FOUND]: "目标不存在",
  [ErrorCode.USER_NOT_FOUND]: "用户不存在",
  [ErrorCode.SUPERVISION_NOT_FOUND]: "监督关系不存在",
  [ErrorCode.RULE_NOT_FOUND]: "规则不存在",
  [ErrorCode.ALREADY_SUPERVISED]: "已监督该用户",
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message || PRODUCTION_MESSAGES[code] || "未知错误");
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code] || 500;
    this.details = details;
  }
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function handleApiError(error: unknown, context: string = "操作"): NextResponse {
  console.error(`[API Error] ${context}:`, error);

  if (error instanceof AppError) {
    const message = isDevelopment()
      ? `${error.message}${error.details ? ` (详情: ${JSON.stringify(error.details)})` : ""}`
      : PRODUCTION_MESSAGES[error.code] || "操作失败";

    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(isDevelopment() && { code: error.code, details: error.details }),
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment() ? `${context}失败: ${error.message}` : `${context}失败，请稍后重试`,
        ...(isDevelopment() && { stack: error.stack }),
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: isDevelopment() ? `${context}失败: ${String(error)}` : `${context}失败，请稍后重试`,
    },
    { status: 500 },
  );
}
