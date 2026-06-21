# Tasks

- [x] Task 1: 创建目录结构和并行执行策略文档
  - [x] SubTask 1.1: 创建 `trae/prompts/p0-security/`、`p1-core-features/`、`p2-ux-enhancement/`、`p3-enhancement/` 目录
  - [x] SubTask 1.2: 生成 `trae/prompts/README.md` — 并行执行策略、依赖关系图、执行顺序建议

- [x] Task 2: 生成 P0 安全修复 Prompt（4 个，全部可并行）
  - [x] SubTask 2.1: 生成 `p0-security/01-rls-policies.md` — 配置 Supabase RLS 行级安全策略
  - [x] SubTask 2.2: 生成 `p0-security/02-zod-validation.md` — 添加 Zod 输入验证
  - [x] SubTask 2.3: 生成 `p0-security/03-error-sanitization.md` — 错误信息脱敏
  - [x] SubTask 2.4: 生成 `p0-security/04-rate-limiting.md` — 添加 Rate Limiting

- [x] Task 3: 生成 P1 核心功能完善 Prompt（6 个，部分可并行）
  - [x] SubTask 3.1: 生成 `p1-core-features/01-drizzle-migration.md` — 统一数据库访问层为 Drizzle ORM
  - [x] SubTask 3.2: 生成 `p1-core-features/02-drizzle-relations.md` — 完善 Drizzle Relations（依赖 3.1）
  - [x] SubTask 3.3: 生成 `p1-core-features/03-frontend-api-integration.md` — 前端接入真实 API（可并行）
  - [x] SubTask 3.4: 生成 `p1-core-features/04-sse-streaming.md` — SSE 流式分析真实调用（可并行）
  - [x] SubTask 3.5: 生成 `p1-core-features/05-data-export.md` — 数据导出功能（可并行）
  - [x] SubTask 3.6: 生成 `p1-core-features/06-reminder-engine.md` — 提醒引擎（可并行）
  - [x] SubTask 3.7: 生成 `p1-core-features/README.md` — P1 依赖关系和并行策略

- [x] Task 4: 生成 P2 体验提升 Prompt（6 个，部分可并行）
  - [x] SubTask 4.1: 生成 `p2-ux-enhancement/01-shadcn-ui-replacement.md` — shadcn/ui 组件替换（可并行）
  - [x] SubTask 4.2: 生成 `p2-ux-enhancement/02-recharts-migration.md` — Recharts 替代手写 SVG（可并行）
  - [x] SubTask 4.3: 生成 `p2-ux-enhancement/03-reusable-components.md` — 抽取可复用组件（依赖 4.1、4.2）
  - [x] SubTask 4.4: 生成 `p2-ux-enhancement/04-error-loading-states.md` — 错误边界和加载态（可并行）
  - [x] SubTask 4.5: 生成 `p2-ux-enhancement/05-server-components.md` — Server Components 改造（可并行）
  - [x] SubTask 4.6: 生成 `p2-ux-enhancement/06-testing.md` — 添加测试（可并行）
  - [x] SubTask 4.7: 生成 `p2-ux-enhancement/README.md` — P2 依赖关系和并行策略

- [x] Task 5: 生成 P3 增强功能 Prompt（6 个，全部可并行）
  - [x] SubTask 5.1: 生成 `p3-enhancement/01-dependency-cleanup.md` — 依赖清理
  - [x] SubTask 5.2: 生成 `p3-enhancement/02-i18n.md` — 国际化支持
  - [x] SubTask 5.3: 生成 `p3-enhancement/03-pwa.md` — PWA 支持
  - [x] SubTask 5.4: 生成 `p3-enhancement/04-theme-toggle.md` — 主题切换
  - [x] SubTask 5.5: 生成 `p3-enhancement/05-mobile-optimization.md` — 移动端优化
  - [x] SubTask 5.6: 生成 `p3-enhancement/06-redis-cache.md` — Redis 缓存
  - [x] SubTask 5.7: 生成 `p3-enhancement/README.md` — P3 并行策略

# Task Dependencies

- Task 1 无依赖，可独立执行
- Task 2-5 均依赖 Task 1（目录结构）
- Task 2、3、4、5 之间无依赖，可并行执行
- 同一 Task 内的 SubTask 大部分可并行执行（见各 README 中的依赖标注）