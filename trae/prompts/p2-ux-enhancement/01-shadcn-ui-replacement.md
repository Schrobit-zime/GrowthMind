# P2-01: shadcn/ui 组件替换手写 HTML 元素

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。
- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`
- 核心页面（都在 `src/app/(main)/`）：
  - `page.tsx` — 仪表盘（~400行，含手写 SVG 图表和 Mock 数据）
  - `records/page.tsx` — 记录列表
  - `record-form/page.tsx` — 记录录入（~400行）
  - `record-detail/page.tsx` — 记录详情
  - `goals/page.tsx` — 目标列表
  - `goal-detail/page.tsx` — 目标详情
  - `analysis/page.tsx` — 智能分析
  - `supervise/page.tsx` — 监督面板（~280行）
  - `supervise-user-detail/page.tsx` — 被监督用户详情
  - `supervise-rules/page.tsx` — 提醒规则（~300行）
  - `gateway/page.tsx` — 模型网关（~270行）
- UI 组件目录：`src/components/ui/`（60+ shadcn/ui 组件已安装但几乎未使用）
- 已安装但未使用的关键依赖：recharts, react-hook-form, zod, sonner, next-themes
- 设计风格：毛玻璃风深色主题，背景 #070A14，主色 #7C5CFF
- 全局样式：`src/app/globals.css`
- 错误边界：`src/app/error.tsx`、`src/app/not-found.tsx`、`src/app/(main)/error.tsx`
- 加载态：`src/app/(main)/loading.tsx`

## 任务目标

将所有页面中的手写原生 HTML 元素（`<button>`、`<input>`、`<select>`、手写 modal div 等）替换为 shadcn/ui 组件，保持现有功能和毛玻璃风设计风格。

## 实施步骤

### 步骤 1：调研现有手写模式

先读取典型页面了解当前手写模式：
- `src/app/(main)/page.tsx`（仪表盘，含大量手写按钮和卡片）
- `src/app/(main)/records/page.tsx`
- `src/app/(main)/record-form/page.tsx`

重点关注以下手写模式并记录替换方案：
- `<button className="...">` 的样式模式
- 毛玻璃卡片 div（`className` 含 `backdrop-blur`、`bg-white/10` 等）
- `<input>` 和 `<select>` 的样式模式
- 手写 modal/dialog 的 DOM 结构

### 步骤 2：按优先级批量替换

按以下优先级替换所有页面中的手写元素：

**P0 最高频（优先替换）：**
- `<button>` → `<Button>`（约 30 处）
- 毛玻璃卡片 div → `<Card>`（约 20 处）
- `<input>` → `<Input>`（约 15 处）

**P1 中频：**
- 手写 modal → `<Dialog>` / `<AlertDialog>`（约 6 处）
- `<select>` → `<Select>`（约 5 处）
- `<textarea>` → `<Textarea>`（约 3 处）

**P2 低频：**
- 手写 badge/label → `<Badge>`（约 8 处）
- 手写 tab 切换 → `<Tabs>`（约 3 处）
- 手写 tooltip → `<Tooltip>`（约 4 处）
- 手写 toast 通知 → `<Sonner>` + `toast()`（替换现有 alert 式通知）

### 步骤 3：保持毛玻璃风设计

通过 className 传递自定义样式，不修改 shadcn/ui 组件源码：

```tsx
// 示例：毛玻璃风 Button
<Button
  variant="outline"
  className="backdrop-blur-md bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#7C5CFF]/50"
>
  提交
</Button>

// 示例：毛玻璃风 Card
<Card className="backdrop-blur-md bg-white/5 border-white/10">
  <CardHeader>
    <CardTitle className="text-white">标题</CardTitle>
    <CardDescription className="text-gray-400">描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
</Card>

// 示例：毛玻璃风 Input
<Input
  className="backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C5CFF]/50"
  placeholder="请输入..."
/>
```

### 步骤 4：逐页面替换

按以下顺序逐个页面替换，每替换一个页面验证一次：

1. `src/app/(main)/page.tsx` — 仪表盘（Dashboard）
2. `src/app/(main)/records/page.tsx` — 记录列表
3. `src/app/(main)/record-form/page.tsx` — 记录录入
4. `src/app/(main)/record-detail/page.tsx` — 记录详情
5. `src/app/(main)/goals/page.tsx` — 目标列表
6. `src/app/(main)/goal-detail/page.tsx` — 目标详情
7. `src/app/(main)/analysis/page.tsx` — 智能分析
8. `src/app/(main)/supervise/page.tsx` — 监督面板
9. `src/app/(main)/supervise-user-detail/page.tsx` — 被监督用户详情
10. `src/app/(main)/supervise-rules/page.tsx` — 提醒规则
11. `src/app/(main)/gateway/page.tsx` — 模型网关

### 步骤 5：全局 toast 通知系统

在 `src/app/layout.tsx` 中引入 `<Toaster />`（来自 sonner），替换所有页面中的 `alert()` 调用：

```tsx
import { Toaster } from "@/components/ui/sonner";

// 在 layout 中
<Toaster
  position="top-right"
  toastOptions={{
    className: "backdrop-blur-md bg-white/10 border border-white/10 text-white",
  }}
/>
```

页面中使用：
```tsx
import { toast } from "sonner";

// 替换 alert("操作成功") 为：
toast.success("操作成功");

// 替换 alert("操作失败") 为：
toast.error("操作失败");
```

## 代码示例

### Button 替换前后对比

```tsx
// 替换前（手写 button）
<button
  onClick={handleSubmit}
  className="px-4 py-2 rounded-lg backdrop-blur-md bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
>
  提交
</button>

// 替换后（shadcn/ui Button）
<Button
  onClick={handleSubmit}
  variant="outline"
  className="backdrop-blur-md bg-white/10 border-white/10 hover:bg-white/20"
>
  提交
</Button>
```

### Card 替换前后对比

```tsx
// 替换前（手写卡片 div）
<div className="rounded-xl p-6 backdrop-blur-md bg-white/5 border border-white/10">
  <h3 className="text-lg font-semibold text-white mb-2">今日数据</h3>
  <p className="text-gray-400">内容...</p>
</div>

// 替换后（shadcn/ui Card）
<Card className="backdrop-blur-md bg-white/5 border-white/10">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg text-white">今日数据</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-400">内容...</p>
  </CardContent>
</Card>
```

### Dialog 替换前后对比

```tsx
// 替换前（手写 modal）
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="rounded-xl p-6 backdrop-blur-md bg-[#0D1124] border border-white/10">
      <h2 className="text-white">确认删除？</h2>
      <button onClick={onConfirm}>确认</button>
      <button onClick={() => setShowModal(false)}>取消</button>
    </div>
  </div>
)}

// 替换后（shadcn/ui AlertDialog）
<AlertDialog open={showModal} onOpenChange={setShowModal}>
  <AlertDialogContent className="backdrop-blur-md bg-[#0D1124] border-white/10">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-white">确认删除？</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="backdrop-blur-md bg-white/5 border-white/10 text-white">
        取消
      </AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm}>确认</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 验收标准

- [ ] 所有 `<button>` 元素已替换为 `<Button>` 组件
- [ ] 所有毛玻璃卡片 div 已替换为 `<Card>` 组件
- [ ] 所有 `<input>` 已替换为 `<Input>` 组件
- [ ] 所有 `<select>` 已替换为 `<Select>` 组件
- [ ] 所有手写 modal 已替换为 `<Dialog>` 或 `<AlertDialog>`
- [ ] 所有 `<textarea>` 已替换为 `<Textarea>` 组件
- [ ] 所有 `alert()` 调用已替换为 `toast()` 通知
- [ ] 所有 badge/label 已替换为 `<Badge>` 组件
- [ ] 所有手写 tab 切换已替换为 `<Tabs>` 组件
- [ ] 所有分享、提示类交互已替换为 `<Tooltip>` 组件
- [ ] 所有替换后的组件保持毛玻璃风设计风格
- [ ] 所有替换后的组件保持原有交互逻辑不变
- [ ] 通过 `pnpm typecheck` 类型检查
- [ ] 通过 `pnpm lint` 代码规范检查
- [ ] 通过 `pnpm build` 构建成功

## 预估工时

3 人天

## 依赖

无（可与其他 P2 任务并行执行）