# 后端 API 与数据库审计报告

> 审计目标：`projects/` 子项目
> 审计范围：15 个 API 路由、认证中间件、9 张数据库表、数据层封装、Middleware 路由守卫、错误处理
> 审计日期：2026-06-22
> 审计依据：基于实际源码静态分析（非运行时测试）

---

## 目录

1. [API 路由逐一审计](#1-api-路由逐一审计)
2. [认证中间件审查](#2-认证中间件审查)
3. [数据库 Schema 分析](#3-数据库-schema-分析)
4. [数据层封装审查](#4-数据层封装审查)
5. [Middleware 路由守卫](#5-middleware-路由守卫)
6. [错误处理一致性](#6-错误处理一致性)
7. [审计结论](#7-审计结论)

---

## 1. API 路由逐一审计

### 1.1 审计汇总表

| # | 路由 | 方法 | 鉴权 | Zod 校验 | 错误处理 | 缓存 | 一致性 |
|---|------|------|------|----------|----------|------|--------|
| 1 | `/api/profile` | GET | ❌ 无 | ❌ 无 | try/catch + console.error | ❌ | ⚠️ 不一致 |
| 2 | `/api/goals` | GET/POST | ✅ authenticateRequest | ✅ createGoalSchema | ✅ handleApiError | ✅ Redis | ✅ |
| 3 | `/api/goals/[id]` | GET/PUT/DELETE | ✅ authenticateRequest | ✅ updateGoalSchema | ✅ handleApiError | ✅ Redis | ✅ |
| 4 | `/api/records` | GET/POST | ✅ authenticateRequest | ✅ createRecordSchema | ✅ handleApiError | ✅ Redis | ✅ |
| 5 | `/api/records/[id]` | GET/PUT/DELETE | ✅ authenticateRequest | ✅ updateRecordSchema | ✅ handleApiError | ✅ Redis | ✅ |
| 6 | `/api/analysis` | GET/POST | ✅ authenticateRequest | ❌ 手工校验 | ✅ handleApiError | ❌ | ⚠️ 部分 |
| 7 | `/api/export` | GET | ✅ authenticateRequest | ❌ 手工校验 | ✅ handleApiError | ❌ | ⚠️ 部分 |
| 8 | `/api/supervise` | GET/POST | ✅ authenticateRequest | ✅ createSupervisionSchema | ✅ handleApiError | ❌ | ✅ |
| 9 | `/api/supervise/[id]` | DELETE | ✅ authenticateRequest | N/A | ✅ handleApiError | ❌ | ✅ |
| 10 | `/api/supervise/search` | GET | ✅ authenticateRequest | ❌ 手工校验 | ⚠️ console.error + 直接返回 | ❌ | ❌ 不一致 |
| 11 | `/api/supervise/rules` | GET/POST | ✅ authenticateRequest | ✅ createReminderRuleSchema | ✅ handleApiError | ❌ | ✅ |
| 12 | `/api/supervise/rules/[id]` | PUT/DELETE | ✅ authenticateRequest | ✅ updateReminderRuleSchema | ✅ handleApiError | ❌ | ✅ |
| 13 | `/api/gateway` | GET/POST | ✅ authenticateRequest | ❌ 手工校验 | ✅ handleApiError | ❌ | ✅ |
| 14 | `/api/cron/check-reminders` | GET | ⚠️ CRON_SECRET | N/A | ⚠️ console.error + 直接返回 | ❌ | ❌ 不一致 |
| 15 | `/api/supabase-config` | GET | ❌ 无 | N/A | try/catch + console.error | ❌ | ❌ 不一致 |

**汇总统计：**
- 鉴权覆盖率：12/15 路由使用 `authenticateRequest`（80%），1 个使用 CRON_SECRET，2 个无鉴权
- Zod 校验覆盖率：6/15 路由使用 Zod schema（40%），5 个手工校验，4 个无校验
- `handleApiError` 覆盖率：11/15 路由使用统一错误处理（73%）
- Redis 缓存覆盖率：4/15 路由启用缓存（仅 goals、records 系列）

---

### 1.2 路由详细分析

#### 1.2.1 `/api/profile` — `src/app/api/profile/route.ts`

**支持方法：** GET

**鉴权：** ❌ **未调用 `authenticateRequest`**。仅通过 `userId` 查询参数获取数据（行 12-15），任何调用方只要知道 `userId` 即可读取他人 profile。

**输入校验：** ❌ 未使用 Zod，仅检查 `userId` 是否存在。

**数据库查询：** 使用 Drizzle ORM `select().from(profiles).where(eq(profiles.userId, userId)).limit(1)`（行 17-21）。

**错误处理：** try/catch + `console.error` + 直接返回 500（行 28-31），**未使用 `handleApiError`**。

**响应格式：** 不一致。成功时直接返回 `result[0]`（无 `success` 包装，行 27），失败时返回 `{ error: "..." }`（无 `success: false`）。

**问题定位：**
- 行 10-32：缺少鉴权，存在 IDOR（不安全直接对象引用）漏洞
- 行 27：响应格式与其他路由不一致
- 行 30：错误响应缺少 `success: false` 字段

---

#### 1.2.2 `/api/goals` — `src/app/api/goals/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ GET/POST 均调用 `authenticateRequest`（行 12-13、35-36）。

**输入校验：** ✅ POST 使用 `validateBody(request, createGoalSchema)`（行 39）。

**数据库查询：**
- GET：`db.select().from(goals).where(eq(goals.userId, auth.user.id)).orderBy(desc(goals.createdAt))`（行 20-24）
- POST：`db.insert(goals).values({...}).returning()`（行 42-54）

**错误处理：** ✅ GET/POST 均使用 `handleApiError`（行 30、61）。

**缓存：** ✅ 使用 Redis 缓存（`cacheGet`/`cacheSet`/`cacheDel`）。

**问题定位：**
- 行 56-57：在 POST 内部使用动态 `import("@/lib/cache")` 加载 `cacheDel`，与文件顶部已导入的 `cacheGet/cacheSet/buildCacheKey` 风格不一致，应统一在顶部导入
- 行 57：`cacheDel(\`growthmind:goals:${auth.user.id}*\`)` 使用通配符删除，但 `cacheDel` 内部使用 `redis.keys(pattern)`，在大规模键场景下存在性能问题（KEYS 命令阻塞）

---

#### 1.2.3 `/api/goals/[id]` — `src/app/api/goals/[id]/route.ts`

**支持方法：** GET、PUT、DELETE

**鉴权：** ✅ 全部调用 `authenticateRequest`（行 15-16、47-48、86-87）。

**输入校验：** ✅ PUT 使用 `updateGoalSchema`（行 52）。

**数据库查询：** 全部使用 `and(eq(goals.id, id), eq(goals.userId, auth.user.id))` 进行所有权校验（行 28、67、94），✅ 防止越权访问。

**错误处理：** ✅ 全部使用 `handleApiError`。

**缓存：** ✅ GET 写缓存，PUT/DELETE 删缓存。

**问题定位：**
- 行 55-63：手工构造 `updateData` 对象，重复代码较多，可考虑封装
- 行 74、96：`cacheDel` 通配符删除性能隐患（同上）

---

#### 1.2.4 `/api/records` — `src/app/api/records/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ 全部调用 `authenticateRequest`（行 12-13、54-55）。

**输入校验：** ✅ POST 使用 `createRecordSchema`（行 58）。

**数据库查询：**
- GET：支持 `dimension`、`from`、`to`、`limit` 过滤（行 32-43）
- POST：`db.insert(records).values({...}).returning()`（行 61-77）

**错误处理：** ✅ 全部使用 `handleApiError`。

**缓存：** ✅ 使用 Redis。

**问题定位：**
- 行 21：`parseInt(searchParams.get("limit") || "50")` 未校验上限，恶意调用方可传 `limit=999999` 拉取全表
- 行 39：`from`/`to` 直接作为字符串比较，依赖 `recordDate` 的 ISO 字符串字典序，未校验日期格式
- 行 79-80：动态 `import("@/lib/cache")` 同样存在风格不一致问题

---

#### 1.2.5 `/api/records/[id]` — `src/app/api/records/[id]/route.ts`

**支持方法：** GET、PUT、DELETE

**鉴权：** ✅ 全部调用 `authenticateRequest`。

**输入校验：** ✅ PUT 使用 `updateRecordSchema`。

**数据库查询：** 全部使用 `and(eq(records.id, id), eq(records.userId, auth.user.id))` 进行所有权校验。

**错误处理：** ✅ 全部使用 `handleApiError`。

**缓存：** ✅ 使用 Redis。

**问题定位：** 与 `/api/goals/[id]` 类似，手工构造 `updateData` 代码冗余（行 55-66）。

---

#### 1.2.6 `/api/analysis` — `src/app/api/analysis/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ 全部调用 `authenticateRequest`（行 9-10、28-29）。

**输入校验：** ❌ **未使用 Zod**。POST 使用 `request.json()` + 手工 `if` 校验（行 32-47），仅检查 `dimensions` 和 `records` 是否存在，未校验 `timeRange`、`analysisType` 类型。

**数据库查询：**
- GET：`db.select().from(analysisHistory).where(eq(analysisHistory.userId, auth.user.id)).orderBy(desc(...)).limit(limit)`（行 14-19）
- POST：**未写入数据库**。`analysisHistory` 表存在但 POST 仅转发到 `/api/gateway`，未持久化分析结果

**错误处理：** ✅ 全部使用 `handleApiError`，并使用 `AppError` + `ErrorCode.AI_GATEWAY_ERROR`（行 86-89）。

**响应格式：** POST 返回 SSE 流（`text/event-stream`），与其他路由 JSON 格式不同（合理，但需注意）。

**问题定位：**
- 行 13：`limit` 默认 10，但未校验上限
- 行 32-33：未使用 Zod，输入校验不完整
- 行 60：`records.slice(0, 20)` 限制传给 AI 的记录数，但未限制 `records` 数组大小，可能造成内存压力
- 行 67-83：通过 `fetch` 调用自身 `/api/gateway`，存在内部 HTTP 调用开销，应考虑直接调用服务函数
- 行 72：`x-session` header 透传，但 GET /api/analysis 未使用此机制
- **POST 未写入 `analysisHistory` 表**，导致 GET 永远查不到 POST 产生的分析结果

---

#### 1.2.7 `/api/export` — `src/app/api/export/route.ts`

**支持方法：** GET

**鉴权：** ✅ 调用 `authenticateRequest`（行 11-12）。

**输入校验：** ❌ **未使用 Zod**。手工校验 `type` 和 `format` 是否在白名单内（行 19-29）。

**数据库查询：**
- records：`db.select().from(records).where(and(...conditions)).orderBy(desc(records.createdAt))`（行 40-44）
- goals：`db.select().from(goals).where(eq(goals.userId, auth.user.id)).orderBy(desc(goals.createdAt))`（行 46-50）

**错误处理：** ✅ 使用 `handleApiError`。

**响应格式：** 返回 CSV/PDF 文件流，非 JSON（合理）。

**问题定位：**
- 行 31：`let data: any[]` 使用 `any` 类型，丢失类型安全
- 行 37-38：`from`/`to` 未校验日期格式
- 行 86-121：PDF 生成使用 `jsPDF`，在 Edge Runtime 下可能不兼容（需确认 runtime 配置）
- 行 114：`Buffer.from(doc.output("arraybuffer"))` 使用 Node.js Buffer，**该路由必须运行在 Node.js Runtime**
- **未导出 `analysisHistory`、`supervisionRelations`、`reminderRules` 等表**，导出能力不完整

---

#### 1.2.8 `/api/supervise` — `src/app/api/supervise/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ 全部调用 `authenticateRequest`（行 11-12、31-32）。

**输入校验：** ✅ POST 使用 `createSupervisionSchema`（行 35）。

**数据库查询：**
- GET：使用 `db.query.supervisionRelations.findMany`（行 15-22），**Relational Query API**，与其他路由的 `db.select()` 风格不同
- POST：先查 `profiles` 验证目标用户存在（行 38-42），再查 `supervisionRelations` 防重复（行 48-56），最后 insert（行 62-69）

**错误处理：** ✅ 全部使用 `handleApiError`。

**缓存：** ❌ 未使用缓存。

**问题定位：**
- 行 15-22：使用 `db.query.*` 风格与其他路由 `db.select()` 不一致，风格混用
- 行 48-56：防重复查询未加唯一索引（schema 中无 `unique` 约束），并发场景下可能产生重复数据
- POST 未在创建后清缓存（虽然本路由未用缓存，但若未来引入需注意）

---

#### 1.2.9 `/api/supervise/[id]` — `src/app/api/supervise/[id]/route.ts`

**支持方法：** DELETE（软删除，将 `active` 设为 false）

**鉴权：** ✅ 调用 `authenticateRequest`（行 12-13）。

**输入校验：** N/A（无请求体）。

**数据库查询：** `db.update(supervisionRelations).set({ active: false }).where(and(eq(...id), eq(...adminUserId)))`（行 18-24）。

**错误处理：** ✅ 使用 `handleApiError`。

**问题定位：**
- 行 18-24：未检查 `result.length`，即使 id 不存在也返回 200 成功，应返回 404
- 缺少 GET/PUT 方法（无法查看单条监督关系详情）

---

#### 1.2.10 `/api/supervise/search` — `src/app/api/supervise/search/route.ts`

**支持方法：** GET

**鉴权：** ✅ 调用 `authenticateRequest`（行 8-9）。

**输入校验：** ❌ **未使用 Zod**。手工校验 `q.length < 2`（行 13-15）。

**数据库查询：** 使用 `sql\`${profiles.displayName} ILIKE ${pattern}\`` 原生 SQL（行 26-31）。

**错误处理：** ❌ **未使用 `handleApiError`**，使用 `console.error` + 直接返回 500（行 36-38）。

**问题定位：**
- 行 17：`%${q}%` 拼接 ILIKE 模式，虽然使用参数化 `sql` 模板避免了 SQL 注入，但未转义 `%` 和 `_` 通配符，用户输入 `%` 会匹配所有
- 行 29：`${profiles.userId}::text ILIKE ${pattern}` 将 uuid 强转 text，无法走索引
- 行 36-38：错误处理风格与其他路由不一致
- 行 34：响应格式 `{ success: true, data: users }` ✅ 一致

---

#### 1.2.11 `/api/supervise/rules` — `src/app/api/supervise/rules/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ 全部调用 `authenticateRequest`（行 11-12、35-36）。

**输入校验：** ✅ POST 使用 `createReminderRuleSchema`（行 39）。

**数据库查询：**
- GET：`db.select().from(reminderRules).where(eq(reminderRules.adminUserId, auth.user.id)).orderBy(desc(...))`（行 18-22）
- POST：`db.insert(reminderRules).values({...}).returning()`（行 42-52）

**错误处理：** ✅ 全部使用 `handleApiError`。

**问题定位：**
- 行 24-26：`supervisedUserId` 过滤在内存中进行（`data.filter`），应在 SQL 层用 `where` 过滤，避免拉取全表
- 行 16：`searchParams.get("supervised_user_id")` 使用下划线命名，与其他路由 camelCase 不一致

---

#### 1.2.12 `/api/supervise/rules/[id]` — `src/app/api/supervise/rules/[id]/route.ts`

**支持方法：** PUT、DELETE

**鉴权：** ✅ 全部调用 `authenticateRequest`。

**输入校验：** ✅ PUT 使用 `updateReminderRuleSchema`。

**数据库查询：** 全部使用 `and(eq(reminderRules.id, id), eq(reminderRules.adminUserId, auth.user.id))` 进行所有权校验。

**错误处理：** ✅ 全部使用 `handleApiError`。

**问题定位：**
- 缺少 GET 方法（无法查看单条规则详情）
- 行 22-26：手工构造 `updateData` 代码冗余

---

#### 1.2.13 `/api/gateway` — `src/app/api/gateway/route.ts`

**支持方法：** GET、POST

**鉴权：** ✅ POST 调用 `authenticateRequest`（行 22-23）。GET 无鉴权（行 97-105，仅返回状态信息，合理）。

**输入校验：** ❌ **未使用 Zod**。手工校验 `body.provider` 和 `body.messages`（行 28-30）。

**数据库查询：** 无直接数据库查询。但 `gatewayUsageLog` 表存在，**POST 未记录调用日志**。

**错误处理：** ✅ 使用 `handleApiError`，并使用 `AppError` + `ErrorCode.AI_PROVIDER_ERROR`（行 73-77）。

**问题定位：**
- 行 26：`body: GatewayRequest = await request.json()` 未校验 `messages` 数组结构
- 行 37-40：API Key 缺失返回 500，应返回 503（服务不可用）或 500（合理但语义上更接近 503）
- 行 53-55：Claude 使用 `/messages` 端点，其他使用 `/chat/completions`，但 Claude 的 `Authorization: Bearer` 实际应使用 `x-api-key` header，**当前实现可能无法正常调用 Anthropic API**
- 行 80-88：流式响应直接透传 `response.body`，未记录 token 用量到 `gatewayUsageLog` 表
- **`gatewayUsageLog` 表从未被任何路由写入**，成为僵尸表

---

#### 1.2.14 `/api/cron/check-reminders` — `src/app/api/cron/check-reminders/route.ts`

**支持方法：** GET

**鉴权：** ⚠️ 使用 `verifyCronRequest` 校验 `CRON_SECRET`（行 11-20），**非 `authenticateRequest`**。开发环境跳过验证（行 14）。

**输入校验：** N/A。

**数据库查询：**
- 查询所有启用的 `reminderRules`（行 138-141）
- `checkNoRecordRule`：查 `records`（行 31-40）
- `checkGoalLaggingRule`：查 `goals`（行 51-59）
- `checkMoodDropRule`：查 `records`（行 75-87）

**错误处理：** ❌ **未使用 `handleApiError`**，使用 `console.error` + 直接返回 500（行 191-195）。

**问题定位：**
- 行 14：开发环境跳过验证，存在安全风险（若 NODE_ENV 误配为 development）
- 行 25、48、69：`rule: any` 类型，丢失类型安全
- 行 62：`g.currentValue / g.targetValue < threshold`，当 `targetValue` 为 0 时虽然前面有 `!== 0` 判断，但 `targetValue` 为负数时逻辑错误
- 行 91-99：`dropping` 判断逻辑：遍历 `moods` 数组（按 `recordDate desc` 排序），`prev = moods[i-1]`（较新），`curr = moods[i]`（较旧），判断 `curr >= prev` 则非下降。逻辑正确但变量命名 `prev/curr` 易混淆
- 行 108-125：`sendNotification` 仅 `console.log`，**未实现真实通知通道**
- 行 152：`for (const rule of rules)` 串行处理，规则数量多时性能差，应考虑 `Promise.all`
- 行 191-195：错误处理风格不一致

---

#### 1.2.15 `/api/supabase-config` — `src/app/api/supabase-config/route.ts`

**支持方法：** GET

**鉴权：** ❌ **无鉴权**。公开端点（middleware 中也显式跳过，`src/middleware.ts` 行 20、45）。

**输入校验：** N/A。

**数据库查询：** 无。

**错误处理：** ❌ try/catch + `console.error` + 直接返回 500（行 17-21），未使用 `handleApiError`。

**响应格式：** ❌ 返回 `{ url, anonKey }`（行 15），无 `success` 包装，与其他路由不一致。

**问题定位：**
- 行 6：返回 Supabase `url` 和 `anonKey`，`anonKey` 是公开密钥（设计如此），但响应格式不一致
- 行 15：响应格式 `{ url, anonKey }` 与其他路由 `{ success: true, data: {...} }` 不一致
- 行 17-21：错误处理风格不一致

---

### 1.3 API 路由问题总结

**严重问题（P0）：**
1. `/api/profile` 缺少鉴权，存在 IDOR 漏洞（行 10-32）
2. `/api/analysis` POST 未持久化到 `analysisHistory`，GET 永远查不到 POST 结果
3. `/api/gateway` POST 未写入 `gatewayUsageLog`，无法追踪 AI 调用成本
4. `/api/cron/check-reminders` 开发环境跳过鉴权，存在误配风险

**一致性问题（P1）：**
5. 4 个路由未使用 `handleApiError`（profile、supervise/search、cron/check-reminders、supabase-config）
6. 5 个路由未使用 Zod 校验（analysis、export、supervise/search、gateway、cron）
7. 响应格式不统一：部分路由无 `success` 包装（profile、supabase-config）
8. 查询风格混用：`db.select()` 与 `db.query.*` 两种风格

**性能问题（P2）：**
9. `cacheDel` 使用 `redis.keys(pattern)`，大规模键场景下阻塞
10. `/api/supervise/rules` GET 在内存中过滤，应下推到 SQL
11. `/api/cron/check-reminders` 串行处理规则，应并行化
12. `/api/records` GET 的 `limit` 未设上限

**功能缺失（P2）：**
13. `/api/supervise/[id]` 缺少 GET 方法
14. `/api/supervise/rules/[id]` 缺少 GET 方法
15. `/api/export` 未支持 `analysisHistory`、`supervisionRelations` 等表导出

---

## 2. 认证中间件审查

### 2.1 文件：`src/lib/api-auth.ts`

```typescript
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult | null> {
  const token = request.headers.get("x-session");
  if (!token) return null;
  try {
    const db = getSupabaseClient(token);
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return null;
    return { user, token };
  } catch {
    return null;
  }
}
```

### 2.2 实现逻辑分析

**Token 解析（行 13）：**
- 从 `x-session` 请求头读取 token
- ❌ **未支持 `Authorization: Bearer` 标准头**，与 `src/middleware.ts` 行 42 的逻辑不一致（middleware 同时支持 cookie 和 Authorization header）
- ❌ **未支持 cookie**，而 `src/lib/data/goals.ts` 和 `records.ts` 使用 cookie 获取用户，存在两套认证机制

**Token 验证（行 16-20）：**
- 调用 `getSupabaseClient(token)` 创建带 token 的 Supabase 客户端
- 调用 `supabase.auth.getUser(token)` 验证 token 并获取用户
- ✅ 使用 Supabase 官方验证方式，安全性高
- ⚠️ 每次请求都创建新的 `SupabaseClient` 实例（`getSupabaseClient` 行 63-76），存在性能开销

**错误处理（行 23-25）：**
- catch 所有异常并返回 `null`，❌ **未记录日志**，调试困难

### 2.3 `unauthorizedResponse` 响应格式

```typescript
export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: "未授权，请先登录" },
    { status: 401 }
  );
}
```

- ✅ 使用 `Response.json`（非 `NextResponse.json`），在 Edge Runtime 下兼容性更好
- ✅ 响应格式 `{ success: false, error: "..." }` 与 `handleApiError` 一致
- ⚠️ 使用全局 `Response` 而非 `NextResponse`，无法附加自定义 headers（如 `WWW-Authenticate`）

### 2.4 鉴权覆盖情况

| 路由 | 是否使用 `authenticateRequest` | 备注 |
|------|-------------------------------|------|
| `/api/profile` | ❌ | IDOR 漏洞 |
| `/api/goals` | ✅ | |
| `/api/goals/[id]` | ✅ | |
| `/api/records` | ✅ | |
| `/api/records/[id]` | ✅ | |
| `/api/analysis` | ✅ | |
| `/api/export` | ✅ | |
| `/api/supervise` | ✅ | |
| `/api/supervise/[id]` | ✅ | |
| `/api/supervise/search` | ✅ | |
| `/api/supervise/rules` | ✅ | |
| `/api/supervise/rules/[id]` | ✅ | |
| `/api/gateway` | ✅（POST） | GET 无鉴权（合理） |
| `/api/cron/check-reminders` | ❌ | 使用 CRON_SECRET |
| `/api/supabase-config` | ❌ | 公开端点（设计如此） |

### 2.5 问题总结

**严重问题（P0）：**
1. `/api/profile` 未使用 `authenticateRequest`，存在 IDOR 漏洞
2. 认证 token 来源不一致：API 路由用 `x-session` header，middleware 用 cookie + Authorization，数据层用 cookie，三套机制并存

**一致性问题（P1）：**
3. `authenticateRequest` 未记录失败日志，调试困难
4. 每次请求创建新 SupabaseClient，性能开销
5. `unauthorizedResponse` 未附加 `WWW-Authenticate` header

**改进建议：**
- 统一 token 获取方式，支持 `x-session` + `Authorization: Bearer` + cookie 三种来源
- 增加失败日志记录
- 复用 SupabaseClient 实例（按 token 缓存）

---

## 3. 数据库 Schema 分析

### 3.1 表结构汇总表

| # | 表名 | 字段数 | 主键 | 索引 | JSONB 字段 | 外键 | RLS |
|---|------|--------|------|------|-----------|------|-----|
| 1 | `profiles` | 7 | ✅ id (uuid) | ❌ 无显式索引 | ❌ | ❌ | ✅ |
| 2 | `supervision_relations` | 5 | ✅ id (uuid) | ❌ 无显式索引 | ❌ | ❌ | ✅ |
| 3 | `records` | 13 | ✅ id (uuid) | ❌ 无显式索引 | ✅ 5 个 | ❌ | ✅ |
| 4 | `goals` | 10 | ✅ id (uuid) | ❌ 无显式索引 | ❌ | ❌ | ✅ |
| 5 | `reminder_rules` | 9 | ✅ id (uuid) | ❌ 无显式索引 | ✅ 2 个 | ❌ | ✅ |
| 6 | `analysis_history` | 8 | ✅ id (uuid) | ❌ 无显式索引 | ✅ 1 个 | ❌ | ❌ |
| 7 | `gateway_usage_log` | 8 | ✅ id (uuid) | ❌ 无显式索引 | ❌ | ❌ | ❌ |
| 8 | `email_templates` | 7 | ✅ id (uuid) | ✅ 1 个 | ✅ 1 个 | ❌ | ❌ |
| 9 | `health_check` | 2 | ✅ id (uuid) | ❌ | ❌ | ❌ | ❌ |

**关键发现：**
- ❌ **9 张表均未在 Drizzle schema 中定义任何索引**（`index()` 调用为零）
- ❌ **9 张表均未定义外键约束**（`references()` 调用为零，仅在 `relations.ts` 中定义逻辑关系）
- ✅ 5 张核心表启用了 RLS（`0001_rls_policies.sql`）
- ❌ `analysis_history`、`gateway_usage_log`、`email_templates`、`health_check` 未启用 RLS

---

### 3.2 各表详细分析

#### 3.2.1 `profiles`（行 5-13）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| userId | uuid | notNull, unique | - | ✅ 唯一约束 |
| displayName | text | notNull | - | ✅ |
| role | text | notNull | `'user'` | ⚠️ 应使用 enum |
| avatarUrl | text | nullable | - | ✅ |
| createdAt | timestamp | nullable | `now()` | ⚠️ 应 notNull |
| updatedAt | timestamp | nullable | `now()` | ⚠️ 应 notNull，且无自动更新触发器 |

**问题：**
- `role` 字段使用 text，注释说明是 `'user' | 'admin'`，应使用 `pgEnum` 或 CHECK 约束
- `createdAt`/`updatedAt` 允许 null，不符合语义
- `updatedAt` 无自动更新触发器，需应用层维护（但代码中未维护）
- 缺少 `userId` 上的索引（虽然有 unique 约束，PostgreSQL 会自动创建唯一索引）

#### 3.2.2 `supervision_relations`（行 16-22）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| adminUserId | uuid | notNull | - | ⚠️ 无 FK 到 profiles |
| supervisedUserId | uuid | notNull | - | ⚠️ 无 FK 到 profiles |
| active | boolean | notNull | `true` | ✅ |
| createdAt | timestamp | nullable | `now()` | ⚠️ 应 notNull |

**问题：**
- ❌ **缺少 `(adminUserId, supervisedUserId, active)` 的唯一索引**，POST 路由中的防重复检查（行 48-56）在并发下会失效
- ❌ **缺少 `adminUserId` 索引**，GET 查询 `where(eq(supervisionRelations.adminUserId, auth.user.id))` 全表扫描
- ❌ 无外键约束，可能产生孤儿记录
- 缺少 `updatedAt` 字段

#### 3.2.3 `records`（行 25-50）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| userId | uuid | notNull | - | ⚠️ 无 FK |
| timeDimension | text | notNull | - | ⚠️ 应使用 enum |
| recordDate | text | notNull | - | ⚠️ 应使用 date 类型 |
| customLabel | text | nullable | - | ✅ |
| learning | jsonb | nullable | `'{}'` | ✅ |
| work | jsonb | nullable | `'{}'` | ✅ |
| life | jsonb | nullable | `'{}'` | ✅ |
| health | jsonb | nullable | `'{}'` | ✅ |
| mood | jsonb | nullable | `'{}'` | ✅ |
| moodScore | integer | nullable | - | ✅ |
| summary | text | nullable | - | ✅ |
| goalId | uuid | nullable | - | ⚠️ 无 FK 到 goals |
| createdAt | timestamp | nullable | `now()` | ⚠️ |
| updatedAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **缺少 `userId` 索引**，所有按用户查询的 SQL 全表扫描
- ❌ **缺少 `(userId, recordDate)` 复合索引**，`/api/records` GET 和 `/api/export` 的范围查询性能差
- ❌ **缺少 `(userId, timeDimension)` 复合索引**，按维度过滤性能差
- ❌ **`recordDate` 使用 text 而非 date 类型**，丧失日期运算和约束能力
- ❌ **`timeDimension` 使用 text**，应使用 `pgEnum`
- ⚠️ 5 个 JSONB 字段无 schema 定义，应用层需自行校验结构
- ⚠️ `goalId` 无外键，可能指向已删除的 goal

#### 3.2.4 `goals`（行 53-65）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| userId | uuid | notNull | - | ⚠️ 无 FK |
| name | text | notNull | - | ✅ |
| dimension | text | notNull | - | ⚠️ 应使用 enum |
| metric | text | notNull | - | ✅ |
| targetValue | real | notNull | - | ⚠️ 应使用 numeric/decimal |
| currentValue | real | notNull | `0` | ⚠️ 应使用 numeric/decimal |
| deadline | text | nullable | - | ⚠️ 应使用 date |
| status | text | notNull | `'active'` | ⚠️ 应使用 enum |
| createdAt | timestamp | nullable | `now()` | ⚠️ |
| updatedAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **缺少 `userId` 索引**
- ❌ **缺少 `(userId, status)` 复合索引**，cron `checkGoalLaggingRule` 查询 `where(eq(goals.userId, ...), eq(goals.status, "active"))` 全表扫描
- ⚠️ `targetValue`/`currentValue` 使用 `real`（浮点），精度丢失，应使用 `numeric`
- ⚠️ `dimension`/`status` 应使用 `pgEnum`

#### 3.2.5 `reminder_rules`（行 68-78）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| adminUserId | uuid | notNull | - | ⚠️ 无 FK |
| supervisedUserId | uuid | notNull | - | ⚠️ 无 FK |
| ruleType | text | notNull | - | ⚠️ 应使用 enum |
| condition | jsonb | notNull | `'{}'` | ✅ |
| actions | jsonb | notNull | `'[]'` | ✅ |
| enabled | boolean | notNull | `true` | ✅ |
| createdAt | timestamp | nullable | `now()` | ⚠️ |
| updatedAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **缺少 `adminUserId` 索引**
- ❌ **缺少 `(supervisedUserId, enabled)` 复合索引**，cron 查询 `where(eq(reminderRules.enabled, true))` 后还需按 `supervisedUserId` 过滤
- ⚠️ `condition`/`actions` JSONB 无 schema 定义

#### 3.2.6 `analysis_history`（行 81-91）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| userId | uuid | notNull | - | ⚠️ 无 FK |
| timeRange | text | notNull | - | ⚠️ 应使用 enum |
| dimensions | jsonb | notNull | `'[]'` | ✅ |
| analysisType | text | notNull | - | ⚠️ 应使用 enum |
| result | text | notNull | - | ✅ |
| modelUsed | text | nullable | - | ✅ |
| tokensUsed | integer | nullable | - | ✅ |
| createdAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **缺少 `userId` 索引**
- ❌ **未启用 RLS**（迁移文件未覆盖此表）
- ⚠️ `timeRange`/`analysisType` 应使用 `pgEnum`
- ⚠️ `tokensUsed` 应 notNull default 0

#### 3.2.7 `gateway_usage_log`（行 94-104）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| userId | uuid | nullable | - | ⚠️ 应 notNull |
| provider | text | notNull | - | ⚠️ 应使用 enum |
| model | text | notNull | - | ✅ |
| tokensIn | integer | notNull | `0` | ✅ |
| tokensOut | integer | notNull | `0` | ✅ |
| cost | real | notNull | `0` | ⚠️ 应使用 numeric |
| source | text | notNull | - | ⚠️ 应使用 enum |
| createdAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **缺少 `userId` 索引**和 `(userId, createdAt)` 复合索引（用于按用户查询用量）
- ❌ **未启用 RLS**
- ❌ **该表从未被任何路由写入**（`/api/gateway` POST 未记录日志），成为僵尸表
- ⚠️ `userId` 允许 null，语义不清

#### 3.2.8 `email_templates`（行 107-116）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| name | text | notNull | - | ✅ |
| subject | text | notNull | - | ✅ |
| body | text | notNull | - | ✅ |
| variables | jsonb | nullable | `'[]'` | ✅ |
| createdBy | uuid | nullable | - | ⚠️ 无 FK |
| createdAt | timestamp | nullable | `now()` | ⚠️ |
| updatedAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **未启用 RLS**
- ❌ **该表从未被任何路由读写**，成为僵尸表
- ⚠️ `name` 应有唯一约束

#### 3.2.9 `health_check`（行 119-122）

| 字段 | 类型 | 约束 | 默认值 | 评价 |
|------|------|------|--------|------|
| id | uuid | PK | `gen_random_uuid()` | ✅ |
| updatedAt | timestamp | nullable | `now()` | ⚠️ |

**问题：**
- ❌ **未启用 RLS**
- ❌ **该表从未被任何路由读写**，成为僵尸表
- ⚠️ 表设计过于简陋，仅 2 个字段

---

### 3.3 索引策略分析

**当前状态：** Drizzle schema 中 **零个显式索引定义**。

**缺失的关键索引（按优先级）：**

| 优先级 | 表 | 索引字段 | 用途 |
|--------|-----|----------|------|
| P0 | records | `(userId, recordDate)` | `/api/records` GET 范围查询 |
| P0 | records | `(userId, createdAt)` | `/api/records` GET 排序 |
| P0 | goals | `(userId, status)` | `/api/cron/check-reminders` 查询 |
| P0 | supervision_relations | `(adminUserId, active)` | `/api/supervise` GET |
| P0 | reminder_rules | `(enabled, supervisedUserId)` | `/api/cron/check-reminders` 查询 |
| P0 | supervision_relations | unique `(adminUserId, supervisedUserId, active)` | 防重复 |
| P1 | analysis_history | `(userId, createdAt)` | `/api/analysis` GET |
| P1 | gateway_usage_log | `(userId, createdAt)` | 用量查询 |
| P1 | records | `(goalId)` | 关联查询 |
| P2 | profiles | `(userId)` | 已有 unique 自动索引 |

### 3.4 表关系定义（`relations.ts`）

**当前状态：** 7 张表定义了逻辑关系（`profiles`、`records`、`goals`、`supervisionRelations`、`reminderRules`、`analysisHistory`、`gatewayUsageLog`、`emailTemplates`），`healthCheck` 无关系。

**问题：**
- ✅ 关系定义完整，覆盖所有外键逻辑关系
- ✅ `supervisionRelations` 使用 `relationName` 区分双向关系（行 38-41）
- ❌ **逻辑关系无数据库约束支撑**，`relations.ts` 仅用于 Drizzle Relational Query API，不生成外键
- ⚠️ `records.goalId` 关联到 `goals.id`，但 `goals` 删除时 `records.goalId` 成为悬空指针

### 3.5 JSONB 字段使用模式

| 表 | 字段 | 默认值 | Schema 定义 | 评价 |
|----|------|--------|-------------|------|
| records | learning | `'{}'` | ❌ 无 | 应用层 Zod `z.record(z.string(), z.unknown())` |
| records | work | `'{}'` | ❌ 无 | 同上 |
| records | life | `'{}'` | ❌ 无 | 同上 |
| records | health | `'{}'` | ❌ 无 | 同上 |
| records | mood | `'{}'` | ❌ 无 | 同上 |
| reminder_rules | condition | `'{}'` | ❌ 无 | 应用层按 `ruleType` 解释 |
| reminder_rules | actions | `'[]'` | ❌ 无 | 应用层 `z.array(z.string())` |
| analysis_history | dimensions | `'[]'` | ❌ 无 | - |
| email_templates | variables | `'[]'` | ❌ 无 | - |

**问题：**
- ⚠️ 所有 JSONB 字段均无数据库层 schema 约束（如 `CHECK` 或 `jsonb_path_check`）
- ⚠️ `records` 的 5 个维度 JSONB 结构未文档化，前后端需自行约定
- ⚠️ `reminder_rules.condition` 按 `ruleType` 有不同结构（`{days}` vs `{threshold}`），未在 schema 层体现

### 3.6 问题总结

**严重问题（P0）：**
1. **零索引**：9 张表均未定义索引，所有按 `userId` 的查询全表扫描
2. **零外键**：9 张表均无外键约束，可能产生孤儿记录
3. **3 张僵尸表**：`gateway_usage_log`、`email_templates`、`health_check` 从未被读写
4. **4 张表未启用 RLS**：`analysis_history`、`gateway_usage_log`、`email_templates`、`health_check`

**设计问题（P1）：**
5. `records.recordDate` 使用 text 而非 date
6. `goals.targetValue`/`currentValue` 使用 real 而非 numeric
7. 多个枚举字段使用 text 而非 `pgEnum`
8. `supervision_relations` 缺少唯一约束防重复
9. `createdAt`/`updatedAt` 允许 null 且无自动更新触发器

**改进建议：**
- 创建 Drizzle 迁移添加上述索引
- 添加外键约束（或至少在应用层校验）
- 启用所有表的 RLS
- 删除或实现 3 张僵尸表
- 将 text 枚举字段改为 `pgEnum`
- 将 `recordDate` 改为 `date` 类型

---

## 4. 数据层封装审查

### 4.1 `src/lib/db.ts`

```typescript
const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  options: "-c statement_timeout=15000",
});
export const db = drizzle(pool, { schema: { ...schema, ...relations } });
```

**分析：**
- ✅ 连接池配置合理（max=10，timeout=10s，statement_timeout=15s）
- ✅ 启用 keepAlive，避免长连接断开
- ✅ 同时导入 schema 和 relations，支持 Relational Query API
- ⚠️ `max: 10` 在高并发场景下可能不足，但需根据实际负载评估
- ⚠️ 使用 `drizzle-orm/node-postgres`，**仅支持 Node.js Runtime**，不兼容 Edge Runtime
- ❌ **无连接池错误处理**（`pool.on('error', ...)` 未注册）
- ❌ **无优雅关闭逻辑**（`pool.end()` 在应用退出时调用）

### 4.2 `src/lib/data/goals.ts`

```typescript
async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value
    || cookieStore.get("sb-growthmind-auth-token")?.value;
  // ...
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {...});
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  return user;
}

export async function getGoalById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const result = await db.select().from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .limit(1);
  return result[0] || null;
}
```

**分析：**
- ❌ **`getCurrentUser` 与 `authenticateRequest` 逻辑重复**，存在两套认证机制
- ❌ **`getCurrentUser` 使用 `cookies()`（next/headers）**，仅在 Server Components 中可用，不能在 API 路由中使用
- ❌ **`getCurrentUser` 使用 `COZE_SUPABASE_URL`/`COZE_SUPABASE_ANON_KEY`**，而 `authenticateRequest` 使用 `getSupabaseClient`，环境变量来源不一致
- ❌ **无错误处理**：`db.select()` 抛异常会直接传播到调用方
- ⚠️ `getGoalById` 仅返回 `result[0] || null`，未区分"不存在"和"无权限"

### 4.3 `src/lib/data/records.ts`

**分析：**
- ❌ 与 `goals.ts` 相同的问题：`getCurrentUser` 重复实现、使用 `cookies()`、无错误处理
- ✅ `getRecordsByGoalId` 支持 `limit` 参数（默认 30）
- ⚠️ `getRecordsByGoalId` 未校验 `goalId` 是否属于当前用户，可能通过 goalId 越权读取他人记录（如果 goalId 是公开的）

### 4.4 问题总结

**严重问题（P0）：**
1. `getCurrentUser` 与 `authenticateRequest` 逻辑重复，两套认证机制并存
2. `getCurrentUser` 使用 `cookies()`，仅在 Server Components 可用，不能在 API 路由中复用
3. 环境变量来源不一致：`data/*.ts` 用 `COZE_SUPABASE_URL`，`api-auth.ts` 用 `getSupabaseClient`

**一致性问题（P1）：**
4. `data/*.ts` 无错误处理，异常直接传播
5. `getRecordsByGoalId` 未校验 goalId 归属

**改进建议：**
- 统一认证机制，`data/*.ts` 应接收 `userId` 参数而非自行获取用户
- 或封装统一的 `getCurrentUser` 工具函数，支持 cookie 和 header 两种来源
- 添加 try/catch 错误处理

---

## 5. Middleware 路由守卫

### 5.1 文件：`src/middleware.ts`

### 5.2 路由匹配规则

```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
```

- ✅ 排除 `_next/static`、`_next/image`、`favicon.ico`、`.svg` 文件
- ⚠️ 未排除其他静态资源（`.png`、`.jpg`、`.css`、`.js` 等），但这些通常由 `_next/static` 覆盖
- ⚠️ matcher 与函数内的 `pathname.startsWith("/_next")` 检查（行 17）重复

### 5.3 静态资源跳过逻辑（行 16-23）

```typescript
if (
  pathname.startsWith("/_next") ||
  pathname.startsWith("/favicon") ||
  pathname.match(/\.(svg|ico|png|jpg|jpeg|gif|webp|json)$/) ||
  pathname === "/api/supabase-config"
) {
  return NextResponse.next();
}
```

- ✅ 跳过 `_next`、favicon、常见图片格式、json
- ⚠️ `.json` 跳过可能过于宽泛（如 `/api/some.json` 会被跳过）
- ✅ `/api/supabase-config` 显式跳过（公开端点）

### 5.4 Edge Runtime 兼容性

**当前状态：** 文件未显式声明 `export const runtime = 'edge'`，但 Next.js middleware 默认运行在 Edge Runtime。

**问题：**
- ❌ **行 4：`import { applyRateLimit } from "@/lib/rate-limit"`**，`rate-limit.ts` 使用 `Map` 内存存储（行 17），在 Edge Runtime 多实例下不共享，限流失效
- ❌ **行 61-64：`createClient(supabaseUrl, supabaseAnonKey, {...})`**，`@supabase/supabase-js` 在 Edge Runtime 下兼容性需验证
- ❌ **行 72-75：`fetch(\`${origin}/api/profile?userId=...\`)`**，middleware 内部 fetch 调用自身 API，存在性能开销和潜在死循环风险
- ⚠️ 未使用 Node.js 专属 API（如 `fs`、`Buffer`），✅ 兼容 Edge Runtime

### 5.5 角色检查实现（行 59-94）

```typescript
if (isAdminRoute(pathname) && accessToken) {
  try {
    const supabase = createClient(...);
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (user) {
      const profileRes = await fetch(`${origin}/api/profile?userId=${user.id}`, {...});
      const profile = profileRes.ok ? await profileRes.json() : null;
      if (profile?.role !== "admin") {
        // 拒绝访问
      }
    }
  } catch {
    // 验证失败处理
  }
}
```

**问题：**
- ❌ **行 6：`adminRoutes = ["/supervise", "/gateway"]`**，但 `/api/gateway` GET 是公开端点（返回状态），不应要求 admin 角色。当前逻辑会拦截 `/api/gateway` GET
- ❌ **行 72-75：通过 fetch 调用 `/api/profile`**，而 `/api/profile` 无鉴权（见 1.2.1），任何人可查询任意 userId 的 profile，**角色检查可被绕过**
- ❌ **行 76：`profile?.role !== "admin"`**，但 `/api/profile` 返回的 profile 对象无 `success` 包装（行 27 直接返回 `result[0]`），`profile.role` 可访问
- ⚠️ **行 88-93：catch 块仅重定向非 API 请求**，API 请求在 catch 中不返回错误，继续执行 `NextResponse.next()`，**可能放行未授权请求**
- ⚠️ **行 59：`isAdminRoute(pathname) && accessToken`**，若无 accessToken，admin 路由不检查角色，直接放行（虽然行 48-56 已拦截无 token 的非 public 请求）

### 5.6 问题总结

**严重问题（P0）：**
1. 角色检查通过 fetch 调用无鉴权的 `/api/profile`，可被伪造绕过
2. `rate-limit.ts` 使用内存 `Map`，Edge Runtime 多实例下限流失效
3. catch 块对 API 请求不返回错误，可能放行未授权请求
4. `/api/gateway` GET 被错误标记为 admin 路由

**设计问题（P1）：**
5. middleware 内部 fetch 调用自身 API，性能开销大
6. matcher 与函数内静态资源检查重复
7. `.json` 跳过规则过于宽泛

**改进建议：**
- 角色检查应直接查询数据库或解码 JWT，不通过内部 fetch
- 限流应使用 Redis（已有 `redis.ts`）
- catch 块应对 API 请求返回 401/403
- `adminRoutes` 应精确区分 GET/POST 等方法

---

## 6. 错误处理一致性

### 6.1 文件：`src/lib/errors.ts`

### 6.2 错误码设计（行 3-22）

```typescript
export enum ErrorCode {
  UNKNOWN = "UNKNOWN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  // ... 17 个错误码
}
```

- ✅ 错误码覆盖全面，包含业务错误（`RECORD_NOT_FOUND` 等）和系统错误（`DB_ERROR` 等）
- ✅ 使用 TypeScript enum，类型安全
- ⚠️ 部分错误码语义重叠：`NOT_FOUND` 与 `RECORD_NOT_FOUND`/`GOAL_NOT_FOUND` 等

### 6.3 HTTP 状态码映射（行 24-43）

- ✅ 每个错误码映射到合理的 HTTP 状态码
- ✅ 包含 401、403、404、409、429、500、502 等

### 6.4 `AppError` 类（行 66-78）

```typescript
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message || PRODUCTION_MESSAGES[code] || "未知错误");
    // ...
  }
}
```

- ✅ 继承 `Error`，支持 `instanceof` 检查
- ✅ 包含 code、statusCode、details 三个字段
- ✅ 默认消息使用 `PRODUCTION_MESSAGES`

### 6.5 `handleApiError` 函数（行 84-123）

```typescript
export function handleApiError(error: unknown, context: string = "操作"): NextResponse {
  console.error(`[API Error] ${context}:`, error);
  if (error instanceof AppError) { ... }
  if (error instanceof Error) { ... }
  return NextResponse.json({ success: false, error: "..." }, { status: 500 });
}
```

- ✅ 统一错误处理入口
- ✅ 区分 `AppError`、`Error`、未知错误三种情况
- ✅ 开发环境返回详细错误（message、details、stack），生产环境返回友好提示
- ✅ 响应格式一致：`{ success: false, error: "...", code?: "...", details?: ... }`
- ⚠️ `console.error` 在生产环境可能泄露敏感信息（如 SQL 错误中的连接字符串）

### 6.6 错误处理覆盖情况

| 路由 | 使用 `handleApiError` | 使用 `AppError` | 一致性 |
|------|----------------------|-----------------|--------|
| `/api/profile` | ❌ | ❌ | ❌ |
| `/api/goals` | ✅ | ❌ | ✅ |
| `/api/goals/[id]` | ✅ | ❌ | ✅ |
| `/api/records` | ✅ | ❌ | ✅ |
| `/api/records/[id]` | ✅ | ❌ | ✅ |
| `/api/analysis` | ✅ | ✅ `AI_GATEWAY_ERROR` | ✅ |
| `/api/export` | ✅ | ❌ | ✅ |
| `/api/supervise` | ✅ | ❌ | ✅ |
| `/api/supervise/[id]` | ✅ | ❌ | ✅ |
| `/api/supervise/search` | ❌ | ❌ | ❌ |
| `/api/supervise/rules` | ✅ | ❌ | ✅ |
| `/api/supervise/rules/[id]` | ✅ | ❌ | ✅ |
| `/api/gateway` | ✅ | ✅ `AI_PROVIDER_ERROR` | ✅ |
| `/api/cron/check-reminders` | ❌ | ❌ | ❌ |
| `/api/supabase-config` | ❌ | ❌ | ❌ |

### 6.7 问题总结

**一致性问题（P1）：**
1. 4 个路由未使用 `handleApiError`（profile、supervise/search、cron/check-reminders、supabase-config）
2. 仅 2 个路由使用 `AppError`（analysis、gateway），其他路由的错误未分类
3. `handleApiError` 的 `console.error` 可能泄露敏感信息

**设计问题（P2）：**
4. 错误码语义重叠（`NOT_FOUND` vs `RECORD_NOT_FOUND`）
5. 未记录错误到外部监控系统（如 Sentry）
6. 未区分客户端错误（4xx）和服务端错误（5xx）的日志级别

**改进建议：**
- 所有路由统一使用 `handleApiError`
- 业务逻辑中使用 `AppError` 抛出具体错误码
- 生产环境屏蔽 `console.error` 的详细信息，改用结构化日志
- 集成 Sentry 等错误监控

---

## 7. 审计结论

### 7.1 整体成熟度评分

| 维度 | 评分（1-10） | 说明 |
|------|-------------|------|
| API 设计一致性 | 5 | 60% 路由遵循统一模式，40% 存在风格偏差 |
| 鉴权安全性 | 4 | 1 个 IDOR 漏洞，3 套认证机制并存，角色检查可绕过 |
| 输入校验完整性 | 5 | 40% 路由使用 Zod，其余手工校验或不校验 |
| 数据库设计 | 3 | 零索引、零外键、3 张僵尸表、4 张表无 RLS |
| 错误处理一致性 | 6 | 统一框架存在，但 27% 路由未使用 |
| 数据层封装 | 4 | 重复认证逻辑、无错误处理、环境变量不一致 |
| Middleware 安全性 | 4 | 角色检查可绕过、限流失效、catch 块放行 |
| 缓存策略 | 6 | Redis 集成完整，但仅 4 个路由使用，`KEYS` 命令隐患 |
| 代码质量 | 6 | TypeScript 类型安全较好，但存在 `any` 和重复代码 |
| 文档与注释 | 5 | 部分文件有 JSDoc，但 schema 和路由文档缺失 |

**综合评分：4.8 / 10**

### 7.2 整体评价

GrowthMind 后端处于**早期原型阶段**，核心功能已实现但存在多个安全漏洞和一致性问题。主要问题集中在：

1. **安全性缺陷**：`/api/profile` IDOR 漏洞、角色检查可绕过、4 张表无 RLS
2. **性能隐患**：零索引导致全表扫描、`KEYS` 命令阻塞、内存限流失效
3. **一致性缺失**：3 套认证机制、4 个路由未用统一错误处理、响应格式不统一
4. **数据完整性**：零外键、3 张僵尸表、`recordDate` 类型不当

### 7.3 优先修复建议

**P0（立即修复）：**
1. 为 `/api/profile` 添加 `authenticateRequest` 鉴权
2. 创建 Drizzle 迁移添加关键索引（records、goals、supervision_relations、reminder_rules）
3. 修复 middleware 角色检查：直接查询数据库而非 fetch `/api/profile`
4. 修复 middleware catch 块：API 请求应返回 401/403
5. 为 `analysis_history`、`gateway_usage_log` 启用 RLS
6. `/api/analysis` POST 持久化结果到 `analysis_history`
7. `/api/gateway` POST 记录调用日志到 `gateway_usage_log`

**P1（短期改进）：**
8. 统一认证机制：`authenticateRequest` 支持 cookie + header
9. 所有路由使用 `handleApiError` 和 Zod 校验
10. 统一响应格式：`{ success: boolean, data?: ..., error?: ... }`
11. 添加外键约束
12. 限流改用 Redis
13. 删除 3 张僵尸表或实现其功能

**P2（长期优化）：**
14. 将 text 枚举字段改为 `pgEnum`
15. `recordDate` 改为 `date` 类型，`targetValue`/`currentValue` 改为 `numeric`
16. `cacheDel` 改用 `SCAN` 替代 `KEYS`
17. 集成 Sentry 错误监控
18. 添加 API 单元测试和集成测试

---

*报告结束*
