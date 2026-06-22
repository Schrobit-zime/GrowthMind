# 转圈问题专项诊断与全面复查 Spec

## Why
用户反馈页面"一直在转圈"无法加载完成，之前的修复（缩短超时、修复 ERR_ABORTED）未能彻底解决问题。需要从端到端视角全面复查整个请求链路，定位转圈根因，同时排查其他潜在 bug。

## What Changes
- 全面复查认证链路：SupabaseConfigProvider → auth-provider → supabase-browser → proxy → API
- 复查 loading 状态管理：isLoading 何时被设置/清除，是否存在永不结束的状态
- 复查 proxy.ts：是否对 /login 等公开路由有阻塞调用（如 Supabase getUser）
- 复查 layout.tsx：SupabaseConfigProvider 与 AuthProvider 嵌套顺序是否正确
- 复查所有页面的 loading/error 边界：是否存在条件渲染死锁
- 复查 API 路由：是否有死循环、未 await 的 Promise、未处理的 rejection
- 复查环境变量：是否所有必需变量已配置
- 输出详细 Markdown 报告到 trae/audit/08-转圈问题诊断与全面复查.md

## Impact
- Affected specs: p0-p1-fixes（已完成）、full-codebase-audit（已完成）
- Affected code: src/proxy.ts、src/components/auth/*、src/lib/supabase-browser.ts、src/app/layout.tsx、所有页面组件、所有 API 路由

## ADDED Requirements

### Requirement: 转圈根因定位
系统 SHALL 在全面复查后明确定位"一直转圈"的根因，并给出具体代码位置和修复方案。

#### Scenario: 转圈问题可复现
- **WHEN** 用户访问任意页面
- **THEN** 页面在 5 秒内完成加载或显示明确错误信息，不应无限转圈

### Requirement: 潜在 Bug 报告
系统 SHALL 输出一份详细 Markdown 报告，包含：
- 转圈问题根因分析
- 所有发现的潜在 Bug（按严重性分级 P0-P3）
- 每个问题的代码位置、复现条件、修复建议
- 整体代码健康度评估

### Requirement: 端到端链路验证
报告 SHALL 包含以下链路的完整追踪分析：
1. 首次访问 / → proxy → 重定向 /login → 渲染登录页
2. 登录提交 → Supabase auth → set-cookie → 重定向 / → 渲染主页
3. 刷新页面 → proxy 验证 token → AuthProvider 初始化 → 加载用户数据
4. 已登录访问 /login → proxy 放行 → AuthProvider 检测 → 重定向 /
