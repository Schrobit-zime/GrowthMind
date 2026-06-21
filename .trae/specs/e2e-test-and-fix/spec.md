# 应用功能端到端测试与修复

## Why
自托管 Supabase 只部署了 GoTrue（认证），没有部署 PostgREST，导致前端 `supabase.from("profiles").select()` 等 PostgREST 调用失败（CORS / 404）。需要修复前后端对接问题，并通过浏览器自动化工具进行全功能端到端测试。

## What Changes
- 修改 `auth-provider.tsx` 使用 Next.js API 路由获取 profile，替代 Supabase PostgREST
- 修复前端所有直接调用 Supabase PostgREST 的代码，统一走 Next.js API 路由
- 使用 agent-browser 技能对应用进行全面的端到端测试
- 记录并修复测试中发现的所有问题

## Impact
- Affected specs: 认证系统、仪表盘、记录管理、目标管理、分析、监督、网关
- Affected code: `auth-provider.tsx`, `supabase-browser.ts`, 所有使用 `supabase.from()` 的前端组件

## ADDED Requirements
### Requirement: 前端数据查询绕过 PostgREST
前端 SHALL 通过 Next.js API 路由访问数据库，不依赖 PostgREST 服务。

#### Scenario: 用户登录后加载 profile
- **WHEN** 用户登录成功
- **THEN** 通过 `/api/profile?userId=xxx` 获取 profile 数据，不走 PostgREST

### Requirement: 全功能端到端测试
使用浏览器自动化工具 SHALL 验证所有核心功能。

#### Scenario: 登录流程
- **WHEN** 用户输入正确的邮箱和密码
- **THEN** 成功登录并跳转到 dashboard

#### Scenario: 记录管理
- **WHEN** 用户创建、编辑、删除成长记录
- **THEN** 数据正确保存和展示

#### Scenario: 目标管理
- **WHEN** 用户创建和管理目标
- **THEN** 目标列表正确展示

## MODIFIED Requirements
### Requirement: AuthProvider 数据获取方式
将 `fetchProfile` 方法从 Supabase PostgREST 改为调用 Next.js API 路由。

## REMOVED Requirements
（无）
