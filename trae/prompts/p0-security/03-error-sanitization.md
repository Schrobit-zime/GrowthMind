# 统一错误处理与信息脱敏

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- **技术栈**：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **后端**：Supabase (Auth + PostgreSQL) + Drizzle ORM
- **包管理**：pnpm（严禁 npm/yarn）
- **项目路径**：`/Users/jahangir/workspace/GrowthMind/projects/`
- **源码目录**：`src/`，API Routes 在 `src/app/api/`
- **中间件**：`src/middleware.ts`（已实现角色守卫和 API 鉴权）
- **API 鉴权**：`src/lib/api-auth.ts`（authenticateRequest 函数）

### 当前问题

1. **所有 API Routes 的 catch 块直接吞掉 error 对象**，返回固定中文错误消息，无法追踪真实错误
2. **gateway/route.ts 第 71-73 行**直接返回上游 API 的原始错误响应，可能泄露 API Key、内部配置等敏感信息
3. **analysis/route.ts 第 63-64 行**直接返回 gateway 的错误文本，同样可能泄露内部信息
4. **开发环境**无法获取详细错误以辅助调试
5. **生产环境**没有统一的错误日志记录机制

### 当前 API Routes 的错误处理模式

```typescript
// 当前所有 API Route 的 catch 块都是这种模式：
catch (error) {  // 或 catch {
  return NextResponse.json(
    { success: false, error: "XX操作失败" },
    { status: 500 }
  );
}
```

### 需要修改的 API Route 文件

| 文件路径 | 说明 |
|----------|------|
| `src/app/api/records/route.ts` | GET + POST |
| `src/app/api/records/[id]/route.ts` | GET + PUT + DELETE |
| `src/app/api/goals/route.ts` | GET + POST |
| `src/app/api/goals/[id]/route.ts` | GET + PUT + DELETE |
| `src/app/api/supervise/route.ts` | GET + POST |
| `src/app/api/supervise/[id]/route.ts` | DELETE |
| `src/app/api/supervise/rules/route.ts` | GET + POST |
| `src/app/api/supervise/rules/[id]/route.ts` | PUT + DELETE |
| `src/app/api/analysis/route.ts` | POST |
| `src/app/api/gateway/route.ts` | POST |

## 任务目标

建立统一的错误处理机制：创建 AppError 类、ErrorCode 枚举和 handleApiError 函数，修改所有 API Routes 的 catch 块，确保生产环境不泄露内部错误详情，同时保留开发环境的调试能力。

## 实施步骤

### 步骤 1：读取现有文件确认当前状态

在执行前，请先读取以下文件确认当前错误处理代码：
- `src/app/api/records/route.ts`
- `src/app/api/records/[id]/route.ts`
- `src/app/api/goals/route.ts`
- `src/app/api/goals/[id]/route.ts`
- `src/app/api/supervise/route.ts`
- `src/app/api/supervise/[id]/route.ts`
- `src/app/api/supervise/rules/route.ts`
- `src/app/api/supervise/rules/[id]/route.ts`
- `src/app/api/analysis/route.ts`
- `src/app/api/gateway/route.ts`

### 步骤 2：创建 `src/lib/errors.ts`

```typescript
import { NextResponse } from "next/server";

/**
 * 错误码枚举
 * 用于统一标识错误类型，便于前端处理和日志分类
 */
export enum ErrorCode {
  // 通用
  UNKNOWN = "UNKNOWN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",

  // 数据库
  DB_ERROR = "DB_ERROR",
  DB_UNIQUE_VIOLATION = "DB_UNIQUE_VIOLATION",

  // 外部服务
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  AI_GATEWAY_ERROR = "AI_GATEWAY_ERROR",
  AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR",

  // 业务
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
  GOAL_NOT_FOUND = "GOAL_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  SUPERVISION_NOT_FOUND = "SUPERVISION_NOT_FOUND",
  RULE_NOT_FOUND = "RULE_NOT_FOUND",
  ALREADY_SUPERVISED = "ALREADY_SUPERVISED",
}

/**
 * 错误码到 HTTP 状态码的映射
 */
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

/**
 * 生产环境安全错误消息映射
 * 生产环境只返回这些通用消息，不泄露内部详情
 */
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

/**
 * 应用级错误类
 * 用于在业务逻辑中抛出带错误码的异常
 */
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

/**
 * 判断当前是否为开发环境
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * 统一 API 错误处理函数
 * - 生产环境：返回安全错误消息，不泄露内部详情
 * - 开发环境：返回详细错误信息，便于调试
 * - 所有环境：记录错误日志到控制台
 *
 * @param error - 捕获的错误对象
 * @param context - 错误发生的上下文（如 "创建记录"）
 * @returns NextResponse
 */
export function handleApiError(
  error: unknown,
  context: string = "操作"
): NextResponse {
  // 打印错误日志（生产环境使用 console.error 以便日志收集）
  console.error(`[API Error] ${context}:`, error);

  // 如果是 AppError，使用其错误码和状态码
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
      { status: error.statusCode }
    );
  }

  // 如果是普通 Error，返回通用错误
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment() ? `${context}失败: ${error.message}` : `${context}失败，请稍后重试`,
        ...(isDevelopment() && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  // 未知错误类型
  return NextResponse.json(
    {
      success: false,
      error: isDevelopment() ? `${context}失败: ${String(error)}` : `${context}失败，请稍后重试`,
    },
    { status: 500 }
  );
}
```

### 步骤 3：修改所有 API Routes 的 catch 块

以 `src/app/api/records/route.ts` 的 POST 为例，修改前：

```typescript
} catch (error) {
  return NextResponse.json(
    { success: false, error: "创建记录失败" },
    { status: 500 }
  );
}
```

修改后：

```typescript
import { handleApiError } from "@/lib/errors";

// ... 在 catch 块中
} catch (error) {
  return handleApiError(error, "创建记录");
}
```

### 步骤 4：修改 gateway/route.ts 的错误信息泄露

gateway/route.ts 第 70-75 行存在严重的信息泄露问题：

```typescript
// 当前代码（泄露上游 API 错误）
if (!response.ok) {
  const errorText = await response.text();
  return NextResponse.json(
    { success: false, error: `模型调用失败: ${errorText}` },
    { status: response.status }
  );
}
```

修改为：

```typescript
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";

// 在 POST 函数中
if (!response.ok) {
  const errorText = await response.text();
  throw new AppError(
    ErrorCode.AI_PROVIDER_ERROR,
    "AI 模型调用失败",
    { provider: body.provider, status: response.status }
  );
}
```

### 步骤 5：修改 analysis/route.ts 的错误信息泄露

analysis/route.ts 第 62-64 行：

```typescript
// 当前代码（泄露 gateway 错误）
if (!gatewayResponse.ok) {
  const err = await gatewayResponse.text();
  return NextResponse.json({ success: false, error: err }, { status: 500 });
}
```

修改为：

```typescript
import { AppError, ErrorCode, handleApiError } from "@/lib/errors";

// 在 POST 函数中
if (!gatewayResponse.ok) {
  throw new AppError(
    ErrorCode.AI_GATEWAY_ERROR,
    "AI 分析服务暂时不可用"
  );
}
```

### 修改映射表

| 文件 | 方法 | 需要导入 | catch 修改 |
|------|------|----------|-------------|
| `records/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取记录列表")` |
| `records/route.ts` | POST | `handleApiError` | `handleApiError(error, "创建记录")` |
| `records/[id]/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取记录")` |
| `records/[id]/route.ts` | PUT | `handleApiError` | `handleApiError(error, "更新记录")` |
| `records/[id]/route.ts` | DELETE | `handleApiError` | `handleApiError(error, "删除记录")` |
| `goals/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取目标列表")` |
| `goals/route.ts` | POST | `handleApiError` | `handleApiError(error, "创建目标")` |
| `goals/[id]/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取目标")` |
| `goals/[id]/route.ts` | PUT | `handleApiError` | `handleApiError(error, "更新目标")` |
| `goals/[id]/route.ts` | DELETE | `handleApiError` | `handleApiError(error, "删除目标")` |
| `supervise/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取监督关系")` |
| `supervise/route.ts` | POST | `handleApiError` | `handleApiError(error, "添加监督关系")` |
| `supervise/[id]/route.ts` | DELETE | `handleApiError` | `handleApiError(error, "解除监督")` |
| `supervise/rules/route.ts` | GET | `handleApiError` | `handleApiError(error, "获取规则列表")` |
| `supervise/rules/route.ts` | POST | `handleApiError` | `handleApiError(error, "创建规则")` |
| `supervise/rules/[id]/route.ts` | PUT | `handleApiError` | `handleApiError(error, "更新规则")` |
| `supervise/rules/[id]/route.ts` | DELETE | `handleApiError` | `handleApiError(error, "删除规则")` |
| `analysis/route.ts` | POST | `handleApiError`, `AppError`, `ErrorCode` | 特殊处理（gateway 错误不再泄露） |
| `gateway/route.ts` | POST | `handleApiError`, `AppError`, `ErrorCode` | 特殊处理（上游 API 错误不再泄露） |

## 验收标准

- [ ] `src/lib/errors.ts` 已创建，包含 AppError 类、ErrorCode 枚举、handleApiError 函数
- [ ] 所有 10 个 API Route 文件的 catch 块均已替换为 `handleApiError(error, context)`
- [ ] gateway/route.ts 不再直接返回上游 API 错误文本
- [ ] analysis/route.ts 不再直接返回 gateway 错误文本
- [ ] 生产环境（`NODE_ENV=production`）只返回安全错误消息，不泄露内部详情
- [ ] 开发环境（`NODE_ENV=development`）返回详细错误信息，便于调试
- [ ] 所有错误都会通过 `console.error` 记录日志
- [ ] 运行 `pnpm ts-check` 无类型错误
- [ ] 运行 `pnpm lint` 无 lint 错误

## 预估工时

1 人天