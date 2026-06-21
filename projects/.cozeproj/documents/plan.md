# GrowthMind 实现计划

## 概述

GrowthMind 是一个个人成长多维数据记录与智能分析平台（Web）。支持管理员与普通用户双角色：管理员可规划自身成长、监督其他用户、设置智能提醒、发送邮件通知；普通用户可记录多维数据、汇报进度、接受监督。系统通过统一模型接入层（Unified Model Gateway）对接多家 AI 厂商，实现智能路由、流式分析、用量统计与成本分析。完整版额外包含目标设定追踪、数据导出（PDF/CSV）、提醒通知与数据对比分析。

集成能力：Supabase（Auth + Database）、LLM（统一模型接入层，支持 OpenAI/Claude/智谱/DeepSeek 等多厂商智能路由）、邮件服务。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js (App Router) | 全栈能力，API Routes + SSR |
| 语言 | TypeScript | 类型安全 |
| React 版本 | React 18 | 稳定生态，与 shadcn/ui 兼容 |
| UI 组件 | shadcn/ui + Tailwind CSS v4 | 高质量组件，与 Next.js 无缝集成 |
| 数据库 | PostgreSQL（Supabase 托管） | 关系型数据，复杂查询支持好 |
| 缓存 | Redis | 分析结果缓存、会话管理、限流 |
| 认证 | Supabase Auth（邮箱登录） | 开箱即用，与数据库深度集成 |
| 角色权限 | Supabase RLS + 自定义中间件 | 行级安全 + 应用层角色校验 |
| 邮件 | Resend / Nodemailer | 事务邮件、提醒通知 |
| 图表 | Recharts | React 原生，灵活可定制 |
| LLM 网关 | 自建 Unified Model Gateway | 隔离业务与厂商差异，智能路由 + 用量/成本分析 |
| 导出 | jsPDF + PapaParse | PDF 和 CSV 导出 |
| 包管理 | pnpm | 环境要求 |

## 功能模块

### 1. 用户认证与角色体系
- 邮箱注册/登录/登出
- 角色：`admin`（管理员）、`user`（普通用户）
- 注册默认 `user` 角色，管理员由已有管理员在后台提升
- Session 管理，x-session Header 鉴权
- 受保护路由中间件 + 角色路由守卫

### 2. 管理员监督系统
- **被监督用户管理**：管理员可添加/移除监督关系，查看被监督用户列表
- **数据查看**：以被监督用户视角查看其仪表盘、记录、目标、分析
- **智能提醒规则**：管理员可为被监督用户设置提醒规则（如"连续3天未记录则提醒"、"目标进度落后20%则提醒"、"心情评分连续低于5则提醒"）
- **提醒通知**：触发规则时向管理员推送通知 + 向被监督用户发送提醒
- **监督报告**：定期生成被监督用户成长摘要

### 3. 邮件系统
- 事务邮件：注册欢迎、密码重置
- 提醒邮件：记录提醒、目标截止提醒、监督规则触发通知
- 定期报告邮件：周报/月报摘要（管理员可配置发送频率）
- 邮件模板管理：支持自定义邮件标题与正文

### 4. 多维数据记录
- 五大维度：学习（学习时长/内容/掌握度/新技能/读书笔记）、工作（任务完成量/项目进展/效率/心得）、生活（作息/饮食/运动/社交）、身体（体重/心率/睡眠/精力/症状）、心情（情绪评分1-10/关键词/压力/感恩日记）
- 时间维度：日报/周报/月报/半年报/年报 + 早/午/晚报
- 字段类型：文本、数字、枚举、日期
- 快捷模板：预设"只记心情"、"工作总结"、"学习打卡"等模板，一键预选对应维度并折叠无关项
- 记录 CRUD，创建时可关联目标

### 5. 统一模型接入层（Unified Model Gateway）
- 多厂商适配：OpenAI / Claude / 智谱 / DeepSeek 统一接口
- 智能路由：按模型可用性、成本、延迟自动选择最优厂商
- 流式输出：SSE 协议透传，前端打字机渲染
- 用量统计：按用户/按模型/按时间维度的 token 消耗统计
- 成本分析：实时成本估算与预算预警
- 分析结果缓存（Redis）：相同参数短时间内不重复调用

### 6. 智能分析
- 前置数据校验：无记录时提示"暂无数据，请先记录"
- LLM 流式输出趋势分析、状态评估、优化建议
- 支持按时间范围、维度组合分析
- 分析历史保存与回看
- 管理员可查看被监督用户的分析结果

### 7. 数据可视化仪表盘
- 默认展示：今日概览卡片 + 趋势折线图
- 可展开：雷达图（五维综合评估）、热力图（日历活跃度）、对比柱状图
- "展开更多"按钮折叠次要图表，避免移动端信息过载
- 管理员视角：可切换查看被监督用户仪表盘

### 8. 目标管理
- 目标设定（维度、指标、目标值、截止日期）
- 进度追踪与完成度展示
- 记录与目标强绑定：录入记录时可关联目标，自动更新目标进度

### 9. 数据导出
- PDF 报告（含图表和分析文字）
- CSV 原始数据导出
- 按时间范围/维度筛选导出

### 10. RESTful API
- `GET/POST /api/v1/records` — 记录读写
- `GET /api/v1/records/:id` — 单条记录
- `GET/POST /api/v1/goals` — 目标读写
- `GET /api/v1/analysis` — 分析结果
- `GET /api/v1/export` — 数据导出
- `GET /api/v1/gateway/stats` — 模型网关用量/成本统计
- `GET/POST /api/v1/supervise` — 监督关系管理
- `GET/POST /api/v1/supervise/rules` — 提醒规则管理
- `GET /api/v1/supervise/users/:id` — 查看被监督用户数据
- `POST /api/v1/notifications/email` — 触发邮件发送
- Bearer Token 鉴权

### 数据结构示例

```typescript
// 用户角色
type UserRole = 'admin' | 'user';

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

// 监督关系
interface Supervision {
  id: string;
  admin_id: string;   // 管理员
  user_id: string;    // 被监督用户
  status: 'active' | 'inactive';
  created_at: string;
}

// 智能提醒规则
interface ReminderRule {
  id: string;
  admin_id: string;
  target_user_id: string;
  type: 'missed_record' | 'goal_lag' | 'mood_drop' | 'custom';
  condition: { metric: string; operator: string; threshold: number; period_days: number };
  action: 'notify_admin' | 'notify_user' | 'send_email' | 'all';
  enabled: boolean;
  created_at: string;
}

// 记录
interface Record {
  id: string;
  user_id: string;
  goal_id?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'semi_annual' | 'annual' | 'morning' | 'noon' | 'evening' | 'custom';
  template?: string;
  period_start: string;
  period_end: string;
  dimensions: {
    learning?: { duration_minutes: number; content: string; mastery: number; new_skills: string; notes: string };
    work?: { tasks_completed: number; project_progress: string; efficiency: number; insights: string };
    life?: { sleep_time: string; wake_time: string; diet: string; exercise: string; social: string };
    health?: { weight: number; heart_rate: number; sleep_quality: number; energy: number; symptoms: string };
    mood?: { score: number; keywords: string[]; stress_level: number; gratitude: string };
  };
  created_at: string;
}

// 目标
interface Goal {
  id: string;
  user_id: string;
  dimension: string;
  metric: string;
  target_value: number;
  current_value: number;
  deadline: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
}

// 邮件日志
interface EmailLog {
  id: string;
  recipient_user_id: string;
  type: 'welcome' | 'reset_password' | 'reminder' | 'report' | 'supervision_alert';
  subject: string;
  status: 'sent' | 'failed';
  sent_at: string;
}
```

## 是否有原型设计

是

## 实施步骤

### 阶段一：原型设计
1. 加载 design-canvas 技能，完成 GrowthMind 全平台原型 HTML 设计（仪表盘、记录列表、记录录入、记录详情、智能分析、目标管理、目标详情、登录、模型网关管理台、监督面板、监督用户详情、提醒规则配置、邮件模板管理等页面），产出原型文件并提示用户验收。

### 阶段二：代码开发
2. 初始化 Next.js 项目，配置 Supabase Auth + Database + Redis + 邮件服务，搭建基础 Layout、导航与角色路由守卫（涉及：`.coze`、`src/app/layout.tsx`、`src/lib/supabase/`、`src/lib/redis/`、`src/lib/mail/`、`src/middleware.ts`）
3. 实现用户认证与角色体系（注册/登录/登出、角色管理、受保护路由）（涉及：`src/app/login/`、`src/lib/auth/`、`src/app/api/auth/`）
4. 实现多维数据记录 CRUD（快捷模板、录入表单、记录列表、详情页、目标关联）（涉及：`src/app/records/`、`src/app/api/v1/records/`、`src/components/record-form/`）
5. 实现统一模型接入层 + 智能分析模块（多厂商适配、智能路由、流式分析、用量统计、成本分析、前置数据校验）（涉及：`src/lib/gateway/`、`src/app/analysis/`、`src/app/api/v1/analysis/`、`src/app/api/v1/gateway/`、`src/app/gateway/`）
6. 实现数据可视化仪表盘（今日概览 + 趋势折线图 + 可展开雷达图/热力图/对比图 + 管理员视角切换）（涉及：`src/app/dashboard/`、`src/components/charts/`）
7. 实现管理员监督系统 + 智能提醒 + 邮件系统（监督关系管理、提醒规则引擎、邮件发送与模板、监督报告）（涉及：`src/app/supervise/`、`src/app/api/v1/supervise/`、`src/lib/reminders/`、`src/lib/mail/`）
8. 实现目标管理 + 数据导出 + RESTful API 完善 + 全量验证（涉及：`src/app/goals/`、`src/app/api/v1/goals/`、`src/app/api/v1/export/`），生成 AGENTS.md

## 页面规格

### 全局导航

##### @nav(web-topbar)
> type: topbar
> platform: web

- @page(/) 仪表盘
- @page(/records) 记录列表
- @page(/analysis) 智能分析
- @page(/goals) 目标管理
- @page(/supervise) 监督面板（仅管理员可见）

### 页面详情

##### @page(/) 仪表盘

**核心职责**：用户登录后的首页，聚合展示个人成长数据概览与关键指标。默认展示今日概览和趋势折线图，次要图表折叠。管理员可切换查看被监督用户。
**访问路径**：顶部导航直达，未登录跳转 @page(/login)。
**布局**：顶部导航栏（Logo + 导航项 + 用户头像菜单）→ 管理员视角切换器（仅管理员可见）→ 主内容区（欢迎语 + 今日概览卡片 + 趋势折线图 + "展开更多"按钮 → 雷达图/热力图/对比图（默认折叠）+ 目标进度条）。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| Logo | 点击 | 跳转 @page(/) | — | — |
| 导航项 | 点击 | 跳转对应页面 | — | 监督面板仅管理员可见 |
| 用户头像 | 点击 | 显示 @nav(web-avatar-menu) | — | — |
| 视角切换器 | 选择 | 切换为被监督用户视角，刷新全部数据 | user_id | 仅管理员 |
| 新增记录按钮 | 点击 | 跳转 @page(/record-form) | — | 首页 CTA |
| 概览卡片 | 点击 | 跳转 @page(/records)?dimension=xxx | dimension | 按维度筛选 |
| 展开更多按钮 | 点击 | 展开雷达图/热力图/对比图区域 | — | 默认折叠 |
| 目标进度条 | 点击 | 跳转 @page(/goals)?goal_id | goal_id | — |

##### @page(/records) 记录列表

**核心职责**：浏览、筛选、搜索所有历史记录。管理员可查看被监督用户记录。
**访问路径**：顶部导航直达。
**布局**：顶部导航栏 → 管理员视角切换器 → 筛选栏（时间维度/日期范围/维度标签）→ 搜索框 → 记录卡片列表（分页/无限滚动）→ 浮动新增按钮。
**列表项字段**：时间维度标签 / 日期 / 涉及维度图标 / 摘要文字 / 心情评分 / 关联目标名称。
**状态**：空态插画 + 引导文案；加载态骨架屏；错误态提示 + 重试。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 筛选标签 | 点击 | 刷新列表 | type, dimension | 多选 |
| 搜索框 | 输入 | 模糊搜索刷新列表 | q | 防抖 |
| 记录卡片 | 点击 | 跳转 @page(/record-detail)?record_id | record_id | — |
| 浮动新增按钮 | 点击 | 跳转 @page(/record-form) | — | — |

##### @page(/record-form) 记录录入/编辑

**核心职责**：创建或编辑一条多维成长记录。快捷模板降低填空疲劳，支持关联目标。
**访问路径**：仪表盘/记录列表新增按钮，或记录详情编辑按钮。编辑模式需传 record_id。
**布局**：顶部导航栏 → 快捷模板选择区（"只记心情"/"工作总结"/"学习打卡"/"全面记录"）→ 时间维度选择器 → 日期选择器 → 维度开关面板（按模板预选）→ 动态表单区域（按选中维度展开，无关折叠）→ 关联目标选择器 → 保存/取消。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 快捷模板 | 点击 | 预选对应维度，折叠无关项 | template | 一键切换 |
| 维度开关 | 切换 | 展开/收起对应表单区 | — | 至少选一个 |
| 关联目标选择器 | 选择 | 绑定目标 | goal_id | 可选 |
| 保存按钮 | 点击 | 提交，跳转 @page(/record-detail)?record_id | record_id | — |
| 取消按钮 | 点击 | 有未保存改动弹出 @modal(discard-confirm) | — | — |

##### @page(/record-detail) 记录详情

**核心职责**：查看单条记录完整内容。
**访问路径**：记录列表卡片点击。缺少 record_id 跳转 @page(/records)。
**布局**：顶部导航栏 → 记录元信息（时间维度/日期/心情评分/关联目标）→ 各维度内容卡片 → 操作按钮（编辑/删除）。
**状态**：加载态骨架屏；不存在 404 提示。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 编辑按钮 | 点击 | 跳转 @page(/record-form)?record_id | record_id | — |
| 删除按钮 | 点击 | 弹出 @modal(confirm-delete-record) | — | 含影响提示 |
| 关联目标 | 点击 | 跳转 @page(/goal-detail)?goal_id | goal_id | — |

##### @page(/analysis) 智能分析

**核心职责**：AI 驱动的成长数据分析与建议。前置校验数据，避免无效 LLM 调用。
**访问路径**：顶部导航直达。
**布局**：顶部导航栏 → 管理员视角切换器 → 分析配置区（时间范围/维度/分析类型）→ 分析按钮 → 前置校验（无数据提示）→ 流式输出分析结果 → 历史分析列表。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 开始分析按钮 | 点击 | 前置校验 → 有数据则 LLM 流式分析 | — | 无数据提示 |
| 历史分析项 | 点击 | 加载历史分析结果 | analysis_id | — |
| 导出分析按钮 | 点击 | 导出 PDF 报告 | analysis_id | — |

##### @page(/goals) 目标管理

**核心职责**：设定、追踪和管理个人成长目标。
**访问路径**：顶部导航直达。
**布局**：顶部导航栏 → 管理员视角切换器 → 目标概览统计 → 目标卡片列表 → 新增浮动按钮。
**列表项字段**：目标名称 / 维度标签 / 进度条 / 当前值/目标值 / 截止日期 / 状态标签。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 目标卡片 | 点击 | 跳转 @page(/goal-detail)?goal_id | goal_id | — |
| 新增按钮 | 点击 | 弹出 @sheet(goal-form) | — | 底部面板 |
| 完成按钮 | 点击 | 标记目标为已完成 | goal_id | 卡片内操作 |

##### @page(/goal-detail) 目标详情

**核心职责**：查看单个目标详细进度与关联记录。
**访问路径**：目标卡片点击。缺少 goal_id 跳转 @page(/goals)。
**布局**：顶部导航栏 → 目标信息（名称/维度/进度环/数值/截止日）→ 进度历史折线图 → 关联记录列表 → 编辑/删除。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 编辑按钮 | 点击 | 弹出 @sheet(goal-form)?goal_id | goal_id | — |
| 删除按钮 | 点击 | 弹出 @modal(confirm-delete-goal) | — | 含影响提示 |
| 关联记录 | 点击 | 跳转 @page(/record-detail)?record_id | record_id | — |

##### @page(/supervise) 监督面板

**核心职责**：管理员查看所有被监督用户列表、监督概览与提醒规则管理入口。
**访问路径**：顶部导航直达（仅管理员可见）。非管理员访问跳转 @page(/)。
**布局**：顶部导航栏 → 监督概览统计（监督人数/活跃人数/今日已记录/触发提醒数）→ 被监督用户卡片列表（头像/名称/最近记录时间/心情趋势/目标完成率/状态标签）→ 添加监督用户按钮。
**列表项字段**：头像 / 用户名 / 最近记录时间 / 本周记录次数 / 心情均值 / 目标完成率 / 活跃状态。
**状态**：空态插画 + "尚未监督任何用户，点击添加"。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 用户卡片 | 点击 | 跳转 @page(/supervise/user-detail)?user_id | user_id | — |
| 添加监督按钮 | 点击 | 弹出 @sheet(add-supervise-user) | — | 搜索并添加用户 |
| 提醒规则按钮 | 点击 | 跳转 @page(/supervise/rules)?user_id | user_id | 卡片内快捷入口 |
| 解除监督按钮 | 点击 | 弹出 @modal(confirm-remove-supervision) | — | 卡片内操作 |

##### @page(/supervise/user-detail) 被监督用户详情

**核心职责**：管理员以被监督用户视角查看其完整数据（仪表盘 + 记录 + 目标 + 分析）。
**访问路径**：监督面板用户卡片点击。缺少 user_id 跳转 @page(/supervise)。
**布局**：顶部导航栏（返回按钮 + 用户名 + 提醒规则入口）→ Tab 切换区（概览/记录/目标/分析）→ 各 Tab 内容（复用仪表盘/记录列表/目标管理/分析页组件，数据源切换为该用户）。
**状态**：加载态骨架屏；用户不存在 404。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| Tab 切换 | 点击 | 切换内容区 | — | 概览/记录/目标/分析 |
| 提醒规则按钮 | 点击 | 跳转 @page(/supervise/rules)?user_id | user_id | — |
| 发送提醒按钮 | 点击 | 弹出 @sheet(send-reminder) | user_id | 手动发送提醒 |
| 记录卡片 | 点击 | 跳转 @page(/record-detail)?record_id | record_id | 只读模式 |

##### @page(/supervise/rules) 提醒规则配置

**核心职责**：管理员为被监督用户配置智能提醒规则。
**访问路径**：监督面板或用户详情进入。缺少 user_id 跳转 @page(/supervise)。
**布局**：顶部导航栏（返回按钮 + 用户名）→ 已有规则列表（规则类型/条件/动作/启用开关）→ 新增规则按钮 → 规则表单（类型选择：未记录提醒/目标滞后/心情下降/自定义 → 条件配置 → 动作选择：通知管理员/通知用户/发送邮件）。
**列表项字段**：规则类型标签 / 条件描述 / 触发动作 / 启用开关 / 编辑/删除。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 启用开关 | 切换 | 启用/禁用规则 | rule_id | — |
| 新增规则按钮 | 点击 | 弹出 @sheet(rule-form) | — | 底部面板 |
| 编辑按钮 | 点击 | 弹出 @sheet(rule-form)?rule_id | rule_id | — |
| 删除按钮 | 点击 | 弹出 @modal(confirm-delete-rule) | — | — |

##### @page(/gateway) 模型网关管理台

**核心职责**：查看统一模型接入层的用量统计与成本分析。
**访问路径**：用户头像菜单 → "模型网关"。
**布局**：顶部导航栏 → 概览卡片（总调用次数/总 Token/总成本）→ 按厂商用量饼图 → 按时间趋势折线图 → 调用明细列表。
**列表项字段**：时间 / 厂商 / 模型 / Token 消耗 / 预估成本 / 调用来源。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 时间范围筛选 | 选择 | 刷新统计数据 | start, end | — |
| 厂商筛选 | 选择 | 刷新列表和图表 | provider | — |
| 明细行 | 点击 | 展开调用详情 | — | — |

##### @page(/login) 登录/注册

**核心职责**：用户认证入口。
**访问路径**：未登录时自动跳转。
**布局**：居中卡片 → 应用 Logo + 名称 → 邮箱输入框 → 密码输入框 → 登录/注册切换 Tab → 提交按钮。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 登录/注册 Tab | 切换 | 切换表单模式 | — | — |
| 提交按钮 | 点击 | 认证成功后跳转 @page(/) | — | — |

**弹窗 confirm-delete-record**：
- 标题："确认删除记录"
- 内容：展示记录标题 + "删除该记录将同时移除其在目标进度中的贡献值，此操作不可撤销"
- 操作：确认（删除并刷新）、取消

**弹窗 confirm-delete-goal**：
- 标题："确认删除目标"
- 内容：展示目标名称 + "删除目标后，关联记录将保留但不再计入进度统计，此操作不可撤销"
- 操作：确认（删除并刷新）、取消

**弹窗 confirm-remove-supervision**：
- 标题："确认解除监督"
- 内容：展示用户名 + "解除后你将无法查看该用户的数据，已配置的提醒规则将自动禁用"
- 操作：确认（解除并刷新）、取消

**底部面板 goal-form**：
- 字段：目标名称、维度、指标、目标值、截止日期
- 操作：保存、取消

**底部面板 add-supervise-user**：
- 搜索框搜索用户（邮箱/用户名）→ 用户列表 → 选择添加
- 操作：确认添加、取消

**底部面板 rule-form**：
- 字段：规则类型、条件参数（指标/运算符/阈值/周期天数）、触发动作（多选）
- 操作：保存、取消

**底部面板 send-reminder**：
- 字段：提醒标题、提醒内容、发送方式（站内通知/邮件）
- 操作：发送、取消

**导航菜单 web-avatar-menu**：
- 模型网关、退出登录
- 管理员额外显示：用户管理（角色提升）
