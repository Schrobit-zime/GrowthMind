# GrowthMind 安全审计报告

> 审查日期：2026-06-21 | 审查人：Codex AI

---

## 一、审计范围

对项目全部源码进行安全审查，重点关注：
- 认证与授权
- 数据泄露风险
- API 安全
- 环境变量管理
- 前端安全
- 依赖安全

## 二、严重问题 🔴

### 2.1 API Routes 无鉴权保护

**位置**：所有 API Routes（`src/app/api/*/route.ts`）

**问题**：所有 API 端点均未验证请求者的身份。任何人都可以直接调用 `/api/records`、`/api/goals` 等接口读取或修改数据。

```typescript
// src/app/api/records/route.ts
export async function GET(request: NextRequest) {
  const db = getSupabaseClient(); // 无 token 参数，使用 service role
  const { data } = await db.from("records").select("*");
  return NextResponse.json({ success: true, data });
}
```

**风险**：
- 未登录用户可读取所有用户数据
- 未登录用户可创建/修改/删除任意记录
- 无用户隔离，A 用户可操作 B 用户的数据

**修复建议**：
```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get("x-session");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const db = getSupabaseClient(token); // 使用用户 token
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // 使用 RLS 或手动过滤 user_id
  const { data } = await db.from("records").select("*").eq("user_id", user.id);
}
```

### 2.2 中间件未实现角色路由守卫

**位置**：`src/middleware.ts`

**问题**：中间件仅做透传，`/supervise*`、`/gateway*` 等 admin 专属路由无服务端保护。

```typescript
export function middleware(request: NextRequest) {
  return NextResponse.next(); // 无任何检查
}
```

**风险**：普通用户可通过直接访问 URL 进入 admin 页面。虽然前端有 `profile?.role !== "admin"` 检查，但这仅是 UI 层面的隐藏，数据仍然不安全。

### 2.3 Service Role Key 暴露风险

**位置**：`src/storage/database/supabase-client.ts`

**问题**：`getSupabaseClient()` 在无 token 时使用 `COZE_SUPABASE_SERVICE_ROLE_KEY`，该 key 绕过所有 RLS 策略。

```typescript
function getSupabaseClient(token?: string): SupabaseClient {
  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey; // 默认使用 service role
  }
}
```

**风险**：所有 API routes 调用 `getSupabaseClient()` 时未传 token，因此都使用 service role key，绕过 RLS。

## 三、高危问题 🟠

### 3.1 前端暴露 Supabase 配置

**位置**：`src/components/auth/supabase-config-provider.tsx`、`src/app/api/supabase-config/route.ts`

**问题**：Supabase URL 和 anon key 通过 API 返回给前端，并存储在 `window.__SUPABASE_CONFIG__`。

**评估**：Supabase anon key 本身设计为公开的（配合 RLS 使用），但如果 RLS 未配置，则存在数据泄露风险。当前项目未配置 RLS。

### 3.2 SQL 注入风险（低）

**位置**：API routes 中的 Supabase SDK 调用

**评估**：使用 Supabase JS SDK 的链式调用（`.eq()`, `.select()`），SDK 内部会参数化查询，SQL 注入风险较低。但如果后续使用 `.rpc()` 调用自定义函数，需注意参数验证。

### 3.3 密码明文传输

**位置**：`src/app/(auth)/login/page.tsx`

**评估**：密码通过 HTTPS 传输（Supabase Auth 处理），前端未做额外加密。这是标准做法，但需确保部署环境启用 HTTPS。

### 3.4 错误信息泄露内部细节

**位置**：多个 API routes

```typescript
// src/app/api/gateway/route.ts
return NextResponse.json(
  { success: false, error: `模型调用失败: ${errorText}` },
  { status: response.status }
);
```

**风险**：将上游 API 错误直接返回给客户端，可能泄露 API key、内部 URL 等敏感信息。

**修复建议**：生产环境应只返回通用错误信息，详细错误记录到服务端日志。

## 四、中危问题 🟡

### 4.1 无请求频率限制

**问题**：所有 API 端点无 rate limiting，容易被暴力攻击或 DDoS。

**影响**：登录接口可被暴力破解，分析接口可被滥用消耗 LLM token。

### 4.2 无 CSRF 防护

**问题**：API routes 未检查 Origin/Referer header，未使用 CSRF token。

**评估**：由于使用 JSON body（非 form POST）且 Supabase session 基于 cookie，CSRF 风险中等。

### 4.3 无输入验证

**问题**：API routes 未对请求体做验证。

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // 直接使用 body 字段，无验证
  const { data } = await db.from("records").insert({
    user_id: body.userId,      // 可能为 undefined
    time_dimension: body.timeDimension, // 可能为非法值
    mood_score: body.moodScore,        // 可能为字符串
  });
}
```

**修复建议**：使用 Zod schema 验证请求体：
```typescript
const createRecordSchema = z.object({
  userId: z.string().uuid(),
  timeDimension: z.enum(["daily", "weekly", "monthly", ...]),
  moodScore: z.number().int().min(1).max(10).optional(),
  // ...
});
```

### 4.4 无 Row Level Security (RLS)

**问题**：Supabase 数据库未配置 RLS 策略。所有表的数据访问完全依赖应用层控制。

**影响**：一旦 API 鉴权绕过，所有数据暴露。

## 五、低危问题 🟢

### 5.1 console.error 残留

**位置**：多处 `console.error()` 调用

**评估**：开发阶段可接受，生产环境应移除或替换为结构化日志。

### 5.2 依赖版本锁定

**评估**：`package.json` 使用 `^` 前缀（如 `"next": "16.1.1"`），`pnpm-lock.yaml` 存在，可保证可重复构建。但需定期更新依赖以修复安全漏洞。

### 5.3 .gitignore 检查

**评估**：`.gitignore` 存在，排除了 `node_modules`、`.next` 等。但未明确排除 `.env` 文件（如果有的话）。

## 六、安全修复优先级

| 优先级 | 问题 | 修复难度 |
|--------|------|----------|
| P0 | API Routes 无鉴权 | 中 — 需在每个 route 添加 session 验证 |
| P0 | 中间件角色守卫 | 低 — 需重写 middleware.ts |
| P0 | Service Role Key 滥用 | 中 — API routes 应使用用户 token |
| P1 | 错误信息泄露 | 低 — 生产环境过滤详细错误 |
| P1 | 无输入验证 | 中 — 为每个 API 添加 Zod schema |
| P1 | 配置 RLS | 中 — 需为每张表编写 RLS 策略 |
| P2 | Rate Limiting | 中 — 需引入 Redis 或边缘中间件 |
| P2 | CSRF 防护 | 低 — 添加 Origin header 检查 |
| P3 | console.error 清理 | 低 |

## 七、总结

项目当前处于**开发阶段**，安全防护几乎为零。核心风险是 **API Routes 无鉴权** — 所有数据接口对匿名用户完全开放。在项目上线前，必须优先解决 P0 级别的三个安全问题。
