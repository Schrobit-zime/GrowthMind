# 修复 P0 转圈问题 Spec

## Why
诊断报告显示 5 个 P0 级问题导致页面"一直转圈"，需要立即修复以恢复正常使用。

## What Changes
- 修复 `useFetch` Hook 在 session 为空时 loading 永不清除的问题
- 修复主页和记录页的 loading 死锁
- 添加客户端认证守卫到 `(main)/layout.tsx`
- 为流式响应添加超时保护

## Impact
- Affected specs: spinning-debug-audit（诊断）
- Affected code: `src/hooks/use-api.ts`、`src/app/(main)/layout.tsx`、`src/app/(main)/page.tsx`、`src/app/(main)/records/page.tsx`、`src/app/api/analysis/route.ts`、`src/app/api/gateway/route.ts`

## ADDED Requirements

### Requirement: useFetch loading 修复
系统 SHALL 在 session 为空时立即将 loading 设置为 false，而非保持 true。

#### Scenario: 未登录用户访问主页
- **WHEN** 用户未登录访问 `/`
- **THEN** 不应无限转圈，应在 3 秒内显示登录提示或重定向到登录页

### Requirement: 客户端认证守卫
系统 SHALL 在 `(main)/layout.tsx` 添加客户端认证守卫。

#### Scenario: 未登录用户访问受保护页面
- **WHEN** 用户未登录访问 `(main)` 下任何页面
- **THEN** 立即重定向到 `/login`

### Requirement: 流式响应超时保护
系统 SHALL 为流式 API 调用添加 30 秒超时。

#### Scenario: AI 服务无响应
- **WHEN** AI 服务（deepseek/openai/claude）超过 30 秒未响应
- **THEN** 请求自动终止并返回超时错误
