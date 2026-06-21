# GrowthMind 项目详细测试计划

## 概述

本计划为 GrowthMind 项目制定全面的测试策略，涵盖单元测试、集成测试和端到端测试，确保项目质量和可靠性。

## 项目现状分析

### 当前测试配置
- **测试框架**: Vitest 3.x
- **组件测试**: @testing-library/react 16.x
- **E2E 测试**: @playwright/test (待配置)
- **测试环境**: jsdom
- **覆盖率工具**: @vitest/coverage-v8

### 现有测试文件
- `src/__tests__/unit/utils.test.ts` - 工具函数测试
- `src/__tests__/helpers/test-utils.tsx` - 测试辅助工具
- `vitest.config.ts` - Vitest 配置
- `vitest.setup.ts` - 测试环境设置

### 项目结构
- **前端**: Next.js 16 (App Router) + React 19
- **后端**: Supabase (Auth + PostgreSQL) + Drizzle ORM
- **UI**: Tailwind CSS v4 + shadcn/ui
- **包管理**: pnpm

## 测试目标

1. **单元测试覆盖率**: 核心业务逻辑达到 80%+
2. **集成测试**: 覆盖所有 API 端点
3. **E2E 测试**: 覆盖关键用户流程
4. **性能测试**: 确保页面加载时间 < 3s
5. **安全测试**: 验证认证和授权机制

## 详细测试计划

### 1. 单元测试 (Unit Tests)

#### 1.1 工具函数测试
- **文件**: `src/__tests__/unit/utils.test.ts`
- **测试内容**:
  - `cn()` 类名合并函数
  - `formatDate()` 日期格式化
  - `validateEmail()` 邮箱验证
  - `sanitizeInput()` 输入清理

#### 1.2 组件测试
- **目录**: `src/__tests__/unit/components/`
- **测试文件**:
  - `stat-card.test.tsx` - 统计卡片组件
  - `record-card.test.tsx` - 记录卡片组件
  - `goal-card.test.tsx` - 目标卡片组件
  - `empty-state.test.tsx` - 空状态组件
  - `error-state.test.tsx` - 错误状态组件
  - `loading-skeleton.test.tsx` - 加载骨架屏

#### 1.3 Hooks 测试
- **目录**: `src/__tests__/unit/hooks/`
- **测试文件**:
  - `use-api.test.ts` - API 请求 Hook
  - `use-sse.test.ts` - SSE 流式请求 Hook
  - `use-mobile.test.ts` - 移动端检测 Hook

#### 1.4 业务逻辑测试
- **目录**: `src/__tests__/unit/lib/`
- **测试文件**:
  - `validations.test.ts` - 表单验证逻辑
  - `cache.test.ts` - 缓存逻辑
  - `rate-limit.test.ts` - 频率限制逻辑
  - `errors.test.ts` - 错误处理逻辑

### 2. 集成测试 (Integration Tests)

#### 2.1 API 端点测试
- **目录**: `src/__tests__/integration/`
- **测试文件**:
  - `records-api.test.ts` - 记录 API 测试
  - `goals-api.test.ts` - 目标 API 测试
  - `analysis-api.test.ts` - 分析 API 测试
  - `supervise-api.test.ts` - 监督 API 测试
  - `gateway-api.test.ts` - 网关 API 测试

#### 2.2 数据库集成测试
- **测试内容**:
  - Drizzle ORM 查询测试
  - 数据库连接池测试
  - 事务处理测试

#### 2.3 认证集成测试
- **测试内容**:
  - Supabase Auth 集成
  - JWT 令牌验证
  - 权限控制测试

### 3. 端到端测试 (E2E Tests)

#### 3.1 核心用户流程
- **目录**: `e2e/`
- **测试文件**:
  - `auth.spec.ts` - 认证流程测试
  - `records.spec.ts` - 记录管理流程
  - `goals.spec.ts` - 目标管理流程
  - `analysis.spec.ts` - 智能分析流程

#### 3.2 关键场景测试
- **测试场景**:
  - 用户注册 → 登录 → 创建记录 → 查看分析
  - 目标创建 → 进度更新 → 完成目标
  - 监督关系建立 → 提醒规则设置 → 接收提醒

#### 3.3 跨浏览器测试
- **浏览器支持**:
  - Chrome (最新版)
  - Firefox (最新版)
  - Safari (最新版)
  - Edge (最新版)

### 4. 性能测试

#### 4.1 页面加载性能
- **测试工具**: Lighthouse CI
- **测试指标**:
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1

#### 4.2 API 响应性能
- **测试内容**:
  - API 端点响应时间 < 200ms
  - 数据库查询优化
  - 缓存命中率测试

### 5. 安全测试

#### 5.1 认证安全测试
- **测试内容**:
  - SQL 注入防护
  - XSS 攻击防护
  - CSRF 攻击防护
  - 暴力破解防护

#### 5.2 数据安全测试
- **测试内容**:
  - 数据加密传输
  - 敏感数据脱敏
  - 访问控制验证

## 测试环境配置

### 开发环境
```bash
# 运行单元测试
pnpm test

# 运行集成测试
pnpm test:integration

# 运行 E2E 测试
pnpm test:e2e

# 生成覆盖率报告
pnpm test:coverage
```

### CI/CD 环境
```yaml
# GitHub Actions 配置
- name: Run Tests
  run: |
    pnpm test:run
    pnpm test:integration
    pnpm test:e2e
```

## 测试数据管理

### 测试数据策略
1. **Mock 数据**: 使用工厂函数生成测试数据
2. **测试数据库**: 使用独立的测试数据库
3. **数据清理**: 每个测试后清理测试数据

### 测试数据示例
```typescript
// 测试数据工厂
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createTestRecord = (overrides = {}) => ({
  id: 'test-record-id',
  title: 'Test Record',
  content: 'Test content',
  userId: 'test-user-id',
  ...overrides
});
```

## 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|----------|
| 工具函数 | 95% | 待测试 |
| 业务逻辑 | 85% | 待测试 |
| 组件 | 80% | 待测试 |
| API 端点 | 90% | 待测试 |
| 总体 | 85% | 待测试 |

## 测试执行计划

### 阶段 1: 基础测试搭建 (1天)
1. 配置 Playwright 测试框架
2. 创建测试数据工厂
3. 编写核心工具函数测试

### 阶段 2: 组件测试 (2天)
1. 编写核心组件测试
2. 编写 Hooks 测试
3. 集成测试环境配置

### 阶段 3: API 测试 (1.5天)
1. 编写 API 端点测试
2. 数据库集成测试
3. 认证流程测试

### 阶段 4: E2E 测试 (2天)
1. 编写核心用户流程测试
2. 跨浏览器测试配置
3. 性能测试集成

### 阶段 5: 优化和完善 (0.5天)
1. 测试覆盖率优化
2. 测试性能优化
3. 文档完善

## 测试工具和依赖

### 核心依赖
```json
{
  "devDependencies": {
    "vitest": "^3",
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "@testing-library/user-event": "^14",
    "@playwright/test": "^1.52.0",
    "@vitest/coverage-v8": "^3",
    "jsdom": "^26"
  }
}
```

### 辅助工具
- **Mock 工具**: vitest 内置 mock
- **断言库**: @testing-library/jest-dom
- **覆盖率**: @vitest/coverage-v8
- **E2E 测试**: Playwright

## 风险评估和应对

### 潜在风险
1. **测试环境复杂性**: Supabase 本地环境配置
2. **测试数据管理**: 测试数据隔离和清理
3. **CI/CD 集成**: 测试流水线稳定性

### 应对措施
1. **环境配置文档**: 提供详细的测试环境搭建指南
2. **数据隔离**: 使用独立的测试数据库和事务回滚
3. **CI 优化**: 测试并行化和缓存优化

## 验收标准

### 单元测试
- [ ] 所有单元测试通过
- [ ] 代码覆盖率达到 85%+
- [ ] 测试执行时间 < 30s

### 集成测试
- [ ] 所有 API 端点测试通过
- [ ] 数据库集成测试通过
- [ ] 认证流程测试通过

### E2E 测试
- [ ] 核心用户流程测试通过
- [ ] 跨浏览器测试通过
- [ ] 性能指标达标

### 安全测试
- [ ] 无 SQL 注入漏洞
- [ ] 无 XSS 漏洞
- [ ] 认证机制安全

## 维护计划

### 日常维护
1. **测试更新**: 随功能更新同步更新测试
2. **覆盖率监控**: 定期检查覆盖率报告
3. **测试性能**: 监控测试执行时间

### 长期维护
1. **测试框架升级**: 定期升级测试依赖
2. **测试策略优化**: 根据项目发展调整测试策略
3. **测试文档**: 维护测试文档和最佳实践

## 总结

本测试计划为 GrowthMind 项目提供全面的测试策略，通过单元测试、集成测试和端到端测试确保项目质量。实施本计划将显著提高代码可靠性和用户体验。