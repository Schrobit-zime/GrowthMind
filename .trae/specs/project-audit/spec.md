# GrowthMind 项目全面分析报告 规范

## Why

GrowthMind 项目已有一套基于 Codex AI 生成的审查文档（`codex/` 目录），但需要一个独立的、结构化的分析报告，从项目定位、功能模块、成熟度、代码质量、优化建议五个维度进行全面解读，并以 Markdown 文件形式存放在根目录的 `trae/` 文件夹中，便于团队快速了解项目全貌。

## What Changes

- 在 `trae/` 目录下生成以下 Markdown 文件：
  - `01-项目定位与概览.md` — 项目定位、核心价值、技术栈、目标用户
  - `02-功能模块分析.md` — 已实现/未实现模块清单、前后端对接状态、API 完整性
  - `03-项目成熟度评估.md` — 各维度成熟度评分、与生产环境的差距分析
  - `04-代码质量审查.md` — TypeScript、React、样式、代码组织、测试覆盖
  - `05-优化建议与路线图.md` — 按优先级分类的优化建议、实施路线图
- 所有报告基于对实际源码的分析，结合 `codex/` 已有审查结论进行验证和补充

## Impact

- Affected specs: 无（新建文档，不修改现有代码）
- Affected code: 无代码变更，仅生成分析文档

## ADDED Requirements

### Requirement: 项目定位与概览报告
系统 SHALL 生成一份包含项目定位、核心价值主张、技术栈全景、目标用户画像、设计风格概述的 Markdown 文档。

#### Scenario: 报告内容完整
- WHEN 读取 `trae/01-项目定位与概览.md`
- THEN 文档包含项目名称、定位描述、技术栈表格、设计规范摘要、与同类产品的差异化分析

### Requirement: 功能模块分析报告
系统 SHALL 生成一份包含所有功能模块实现状态、前后端对接情况、API 路由完整性、数据库表使用情况的 Markdown 文档。

#### Scenario: 模块清单准确
- WHEN 读取 `trae/02-功能模块分析.md`
- THEN 文档包含每个模块的页面/路由/API/数据库状态，标注 Mock/已对接/未实现

### Requirement: 项目成熟度评估报告
系统 SHALL 生成一份包含各维度成熟度评分、与生产环境差距分析、技术债务评估的 Markdown 文档。

#### Scenario: 评分维度全面
- WHEN 读取 `trae/03-项目成熟度评估.md`
- THEN 文档包含前端完成度、后端完成度、安全性、测试覆盖、文档完整性、性能等维度评分

### Requirement: 代码质量审查报告
系统 SHALL 生成一份包含 TypeScript 类型安全、React 最佳实践、样式一致性、代码组织、依赖使用情况的 Markdown 文档。

#### Scenario: 问题定位精确
- WHEN 读取 `trae/04-代码质量审查.md`
- THEN 文档包含具体文件路径和行号的问题定位，附带修复建议

### Requirement: 优化建议与路线图报告
系统 SHALL 生成一份包含按优先级分类的优化建议、实施路线图、资源估算的 Markdown 文档。

#### Scenario: 建议可执行
- WHEN 读取 `trae/05-优化建议与路线图.md`
- THEN 文档包含 P0/P1/P2/P3 分级建议，每个建议附带具体实施方案和影响评估
