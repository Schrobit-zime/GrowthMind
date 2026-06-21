# GrowthMind 优化任务并行拆分与 Agent Prompt 生成 规范

## Why

[trae/05-优化建议与路线图.md](file:///Users/jahangir/workspace/GrowthMind/trae/05-优化建议与路线图.md) 已识别出 22 项优化建议，按 P0→P3 优先级排序。但该文档面向人类阅读，不便于直接交付给 AI Agent 并行执行。需要将其拆分为多个可并行的独立任务，每个任务附带一个高质量、自包含的 Agent Prompt，确保 Agent 可以独立理解上下文并完成工作。

## What Changes

- 在 `trae/prompts/` 目录下生成 4 组可并行执行的 Prompt 文件：
  - `p0-security/` — P0 安全修复（4 个 Prompt，全部可并行）
  - `p1-core-features/` — P1 核心功能完善（6 个 Prompt，4 个可并行）
  - `p2-ux-enhancement/` — P2 体验提升（6 个 Prompt，4 个可并行）
  - `p3-enhancement/` — P3 增强功能（6 个 Prompt，全部可并行）
- 每个 Prompt 文件包含完整的项目上下文、任务描述、实施步骤、代码示例、验收标准
- 输出一份并行执行策略说明（`trae/prompts/README.md`），包含依赖关系和执行顺序

## Impact

- Affected specs: 无（新建辅助文档，不修改现有代码）
- Affected code: 无代码变更，仅生成 Agent Prompt 文件

## ADDED Requirements

### Requirement: 生成 P0 安全修复并行 Prompt
系统 SHALL 生成 4 个独立的 Agent Prompt 文件，分别对应 RLS 配置、Zod 验证、错误脱敏、Rate Limiting，每个 Prompt 自包含且可独立执行。

#### Scenario: P0 Prompt 可独立执行
- WHEN Agent 读取任意一个 P0 Prompt 文件
- THEN Agent 能够理解项目上下文、任务目标、实施步骤，无需额外查询

### Requirement: 生成 P1 核心功能并行 Prompt
系统 SHALL 生成 6 个 Prompt 文件，标注依赖关系（Drizzle Relations 依赖 Drizzle 迁移），标明哪些可并行、哪些需串行。

#### Scenario: 依赖关系标注清晰
- WHEN 人类阅读 P1 目录下的 README
- THEN 明确知道哪些任务可并行、哪些依赖前序任务

### Requirement: 生成 P2 体验提升并行 Prompt
系统 SHALL 生成 6 个 Prompt 文件，标注依赖关系，标明可并行执行的任务。

### Requirement: 生成 P3 增强功能并行 Prompt
系统 SHALL 生成 6 个 Prompt 文件，全部标注为可并行执行。

### Requirement: 生成并行执行策略文档
系统 SHALL 生成一份 `trae/prompts/README.md`，包含：
- 总体并行策略说明
- 各优先级组的依赖关系图
- 推荐执行顺序
- 每个 Prompt 的简要说明和预估工时

#### Scenario: 策略文档可指导执行
- WHEN 人类阅读 README.md
- THEN 能够理解如何分阶段、并行地执行所有 22 个优化任务