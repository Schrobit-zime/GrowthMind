# P0 紧急修复 + P1 核心功能完善 规范

## Why

项目全面审计报告（[trae/audit/07-综合评分与修复清单.md](file:///Users/jahangir/workspace/GrowthMind/trae/audit/07-综合评分与修复清单.md)）揭示 22 项 P0 紧急问题和 25 项 P1 核心功能缺陷，涵盖安全漏洞、功能失效、数据完整性、代码质量、性能优化、基础设施等领域。综合评分仅 4.64/10，必须立即修复才能达到可部署状态。

## What Changes

### 安全修复（P0 6项 + P1 3项）
- **P0-01** `/api/profile` IDOR 漏洞修复
- **P0-02** drizzle 直连绕过 RLS 修复
- **P0-03** Cookie httpOnly/Secure 添加
- **P0-06** middleware 角色检查加固
- **P0-07** middleware catch 块放行修复
- **P0-10** 4 张表 RLS 补充
- **P0-18** 登录接口限流
- **P0-19** 限流改为 Redis 分布式
- **P0-20** cron 移除开发环境跳过鉴权
- **P1-03** 认证守卫迁移到 middleware
- **P1-07** 统一认证机制
- **P1-12** middleware 验证 token 有效性

### 数据/API 修复（P0 6项 + P1 4项）
- **P0-04** 前端接口 snake_case → camelCase
- **P0-05** 数据库添加索引
- **P0-08** analysis POST 持久化
- **P0-09** gateway POST 记录调用日志
- **P0-15** N+1 查询修复
- **P0-16** 导出接口添加 limit
- **P1-08** 所有路由统一 handleApiError + Zod 校验
- **P1-09** 统一响应格式
- **P1-10** 添加外键约束
- **P1-14** check-reminders 类型安全重构

### 前端修复（P0 4项 + P1 5项）
- **P0-11** 5 个页面添加错误态
- **P0-12** GlobalErrorBoundary 接入
- **P0-13** 主题切换修复
- **P0-14** 非空断言替换
- **P1-01** supervise-user-detail 接入 API
- **P1-02** 统一数据获取方式
- **P1-04** 移动端管理员入口
- **P1-05** alert() 替换为 Toast
- **P1-06** 删除未使用导入

### 性能优化（P0 2项 + P1 4项）
- **P0-17** cacheDel KEYS → SCAN
- **P1-15** 清理未使用依赖
- **P1-16** 删除未使用 UI 组件
- **P1-17** 图表组件 memo 化
- **P1-18** 动态导入 recharts
- **P1-19** Supabase 客户端复用

### 基础设施（P0 4项 + P1 7项）
- **P0-21** 创建 .env.example
- **P0-22** 集成 Sentry 错误追踪
- **P1-11** 删除僵尸表或实现功能
- **P1-13** 消除 getCurrentUser 重复
- **P1-20** 配置 Husky + lint-staged + commitlint
- **P1-21** 添加 Prettier
- **P1-22** 创建 Dockerfile
- **P1-23** 创建 CI/CD 流水线
- **P1-24** 实现优雅关闭
- **P1-25** 添加 /api/health 端点

## Impact

- Affected specs: full-codebase-audit（基于审计报告执行修复）
- Affected code: 覆盖 `src/app/`、`src/components/`、`src/lib/`、`src/storage/`、项目根目录配置文件

## ADDED Requirements

### Requirement: 所有 P0 安全问题修复
系统 SHALL 修复 22 项 P0 紧急问题，包括安全漏洞、功能失效、数据完整性风险。

#### Scenario: 安全漏洞全部修复
- **WHEN** 审计报告中的 P0 项全部修复后
- **THEN** `/api/profile` 有认证保护、RLS 生效、Cookie 有安全属性、middleware 角色检查安全

### Requirement: 所有 P1 核心功能完善
系统 SHALL 完成 25 项 P1 核心功能完善，包括功能补全、代码质量提升、基础设施搭建。

#### Scenario: 核心功能可用
- **WHEN** P1 项全部完成后
- **THEN** 所有页面功能正常、认证机制统一、CI/CD 就绪、可容器化部署