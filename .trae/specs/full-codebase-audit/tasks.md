# Tasks

- [x] Task 1: 生成 `trae/audit/01-前端架构与页面审计.md`
  - [x] SubTask 1.1: 逐一分析 12 个页面路由的组件依赖、加载态/错误态处理方式
  - [x] SubTask 1.2: 评估共享组件（71个）的复用率和设计一致性
  - [x] SubTask 1.3: 审查 `auth-provider.tsx` 和 `supabase-config-provider.tsx` 的状态管理模式
  - [x] SubTask 1.4: 检查响应式适配（`app-layout.tsx`、`mobile-bottom-nav.tsx`、各页面移动端布局）
  - [x] SubTask 1.5: 审查 `app/layout.tsx` 的全局 Provider 嵌套结构和 SSR 兼容性

- [x] Task 2: 生成 `trae/audit/02-后端 API 与数据库审计.md`
  - [x] SubTask 2.1: 逐一审计 15 个 API 路由的 HTTP 方法、鉴权方式、输入校验逻辑
  - [x] SubTask 2.2: 审查 `api-auth.ts` 的认证中间件实现和一致性使用
  - [x] SubTask 2.3: 分析 `schema.ts` 中 9 张表的字段设计合理性、索引策略、关系定义
  - [x] SubTask 2.4: 审查 `lib/data/` 数据层封装（goals.ts、records.ts）的查询模式和错误处理
  - [x] SubTask 2.5: 检查 `middleware.ts` 的路由守卫逻辑、Edge Runtime 兼容性、静态资源跳过

- [x] Task 3: 生成 `trae/audit/03-安全与认证审计.md`
  - [x] SubTask 3.1: 追踪完整认证链路（Supabase Auth → cookie 写入 → middleware 读取 → API route 验证）
  - [x] SubTask 3.2: 检查 cookie 安全属性（httpOnly、secure、sameSite、过期时间）
  - [x] SubTask 3.3: 审查 `migrations/0001_rls_policies.sql` 的 RLS 策略覆盖完整性
  - [x] SubTask 3.4: 检查所有 API 路由的输入校验覆盖率（Zod schema 使用情况）
  - [x] SubTask 3.5: 扫描代码中的敏感信息暴露风险（日志、错误响应、硬编码密钥）

- [x] Task 4: 生成 `trae/audit/04-代码质量与规范审计.md`
  - [x] SubTask 4.1: 统计全项目 `any` 类型使用情况，列出具体文件和行号
  - [x] SubTask 4.2: 检测重复代码模式（API 路由的错误处理、数据获取、响应格式）
  - [x] SubTask 4.3: 审查命名规范一致性（文件名、组件名、函数名、变量名、数据库列名）
  - [x] SubTask 4.4: 检查 `lib/errors.ts` 和 `lib/validations/` 的统一错误处理和校验模式
  - [x] SubTask 4.5: 审查 TypeScript 严格模式下的类型推断和类型断言使用

- [x] Task 5: 生成 `trae/audit/05-依赖与性能审计.md`
  - [x] SubTask 5.1: 对比 package.json 依赖与实际 import 使用，识别未使用依赖
  - [x] SubTask 5.2: 分析 52 个 shadcn/ui 组件中未使用的组件数量
  - [x] SubTask 5.3: 审查 `db.ts` 的连接池配置、查询超时、连接泄漏风险
  - [x] SubTask 5.4: 审查 `redis.ts` 和 `cache.ts` 的缓存策略、TTL 设置、序列化方式
  - [x] SubTask 5.5: 评估 `recharts` 图表组件的渲染性能和数据量限制

- [x] Task 6: 生成 `trae/audit/06-测试覆盖与 DevOps 审计.md`
  - [x] SubTask 6.1: 扫描现有测试文件，统计测试用例数量和覆盖模块
  - [x] SubTask 6.2: 检查 Vitest 和 Playwright 配置，评估测试基础设施就绪度
  - [x] SubTask 6.3: 审查环境变量管理（`.env` 模板、敏感变量处理、运行时校验）
  - [x] SubTask 6.4: 检查部署相关配置（`Dockerfile`、`docker-compose`、构建脚本、健康检查）

- [x] Task 7: 生成 `trae/audit/07-综合评分与修复清单.md`
  - [x] SubTask 7.1: 汇总 Task 1-6 的审计发现，按维度生成评分（1-10分）
  - [x] SubTask 7.2: 将所有问题按 P0/P1/P2/P3 分级，每项包含文件路径、问题描述、修复方案
  - [x] SubTask 7.3: 制定分阶段实施路线图（紧急修复 → 核心完善 → 体验提升 → 增强功能）

# Task Dependencies

- Task 1-6 无相互依赖，可全部并行执行
- Task 7 依赖 Task 1-6 全部完成
