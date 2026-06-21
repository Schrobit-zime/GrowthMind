# Checklist

- [x] `trae/prompts/README.md` 存在，包含并行策略、依赖关系图、执行顺序
- [x] `trae/prompts/p0-security/` 包含 4 个 Prompt 文件，每个自包含且可独立执行
- [x] `trae/prompts/p1-core-features/` 包含 6 个 Prompt 文件 + README 依赖说明
- [x] `trae/prompts/p2-ux-enhancement/` 包含 6 个 Prompt 文件 + README 依赖说明
- [x] `trae/prompts/p3-enhancement/` 包含 6 个 Prompt 文件 + README 并行说明
- [x] 每个 Prompt 包含：项目上下文、任务描述、实施步骤、代码示例、验收标准
- [x] 每个 Prompt 包含必要的文件路径引用，Agent 无需额外查询
- [x] 并行策略明确标注：哪些任务可并行、哪些有依赖关系
- [x] 所有 Prompt 使用中文撰写
- [x] Prompt 文件总数 = 22 个任务 Prompt + 1 个总 README + 4 个分组 README = 27 个文件