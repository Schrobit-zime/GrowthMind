# P1-05：数据导出功能

## 项目上下文

GrowthMind 是个人成长多维数据记录与智能分析平台。

- 技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase (Auth + PostgreSQL) + Drizzle ORM
- 包管理：pnpm（严禁 npm/yarn）
- 项目路径：`/Users/jahangir/workspace/GrowthMind/projects/`
- 源码目录：`src/`

### 相关文件

- 已安装依赖：`papaparse`（CSV 解析/生成）、`jspdf`（PDF 生成）
- 记录列表页：`src/app/(main)/records/page.tsx`
- 目标列表页：`src/app/(main)/goals/page.tsx`
- 认证上下文：`src/components/auth/auth-provider.tsx`
- API 认证：`src/lib/api-auth.ts`

## 任务目标

实现数据导出功能，支持将记录（records）和目标（goals）数据导出为 CSV 和 PDF 格式，并在前端页面添加导出按钮。

## 实施步骤

### 步骤 1：创建导出 API 端点

**目标文件**：`src/app/api/export/route.ts`

创建 GET 端点，支持以下查询参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `"records" \| "goals"` | 是 | 导出数据类型 |
| `format` | `"csv" \| "pdf"` | 是 | 导出格式 |
| `from` | `string` (ISO date) | 否 | 过滤起始日期（仅 records） |
| `to` | `string` (ISO date) | 否 | 过滤结束日期（仅 records） |
| `dimension` | `string` | 否 | 过滤维度（仅 records） |

**响应**：
- CSV：`Content-Type: text/csv`，`Content-Disposition: attachment; filename="records.csv"`
- PDF：`Content-Type: application/pdf`，`Content-Disposition: attachment; filename="records.pdf"`

### 步骤 2：实现 CSV 导出

使用 `papaparse` 库生成 CSV：

```typescript
import Papa from "papaparse";

function generateCSV(data: Record<string, unknown>[]): string {
  return Papa.unparse(data, {
    header: true,
    // 将 JSONB 字段序列化为字符串
  });
}
```

**Records CSV 列**：
- `id`, `record_date`, `time_dimension`, `mood_score`, `summary`, `learning`, `work`, `life`, `health`, `mood`, `goal_id`, `created_at`

**Goals CSV 列**：
- `id`, `name`, `dimension`, `metric`, `target_value`, `current_value`, `deadline`, `status`, `created_at`

### 步骤 3：实现 PDF 导出

使用 `jspdf` 库生成 PDF：

```typescript
import { jsPDF } from "jspdf";

function generatePDF(data: Record<string, unknown>[], title: string): Buffer {
  const doc = new jsPDF();
  
  // 设置中文字体（需要嵌入字体文件）
  // doc.addFont("path/to/font.ttf", "CustomFont", "normal");
  // doc.setFont("CustomFont");
  
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  let y = 30;
  
  for (const row of data) {
    // 每行渲染关键字段
    const text = `${row.record_date || row.name}: ${row.summary || row.status}`;
    doc.text(text, 14, y);
    y += 8;
    
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}
```

**注意**：jsPDF 默认不支持中文字体，需要嵌入中文字体文件。如果不方便嵌入字体，可以先使用英文标签，在后续迭代中完善中文支持。

### 步骤 4：添加前端导出按钮

在 `src/app/(main)/records/page.tsx` 和 `src/app/(main)/goals/page.tsx` 中添加导出按钮。

**Records 页面导出按钮**：
在搜索栏旁边添加导出下拉菜单：

```tsx
import { Download, FileSpreadsheet, FileText } from "lucide-react";

function ExportButton({ type }: { type: "records" | "goals" }) {
  const { session } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "csv" | "pdf") => {
    if (!session?.access_token) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ type, format });
      const res = await fetch(`/api/export?${params}`, {
        headers: { "x-session": session.access_token },
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("导出失败:", err);
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-2 bg-surface-container border-none rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-4 h-4" />
        {exporting ? "导出中..." : "导出"}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-surface/95 backdrop-blur-xl border border-border/20 rounded-xl shadow-float z-20 py-1 min-w-[140px]">
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-container transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              导出 CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-container transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              导出 PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 步骤 5：集成到页面

在 Records 页面搜索栏区域添加导出按钮：

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <div className="relative flex-1 max-w-xs">
    {/* 搜索框 */}
  </div>
  <ExportButton type="records" />
</div>
```

在 Goals 页面标题区域添加导出按钮。

## 代码示例

### 完整的 `src/app/api/export/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import Papa from "papaparse";
import { jsPDF } from "jspdf";

const { records, goals } = schema;

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "records" | "goals";
    const format = searchParams.get("format") as "csv" | "pdf";

    if (!type || !format) {
      return NextResponse.json(
        { success: false, error: "缺少 type 或 format 参数" },
        { status: 400 }
      );
    }

    if (!["records", "goals"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "type 必须是 records 或 goals" },
        { status: 400 }
      );
    }

    if (!["csv", "pdf"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "format 必须是 csv 或 pdf" },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>[];

    if (type === "records") {
      const conditions = [eq(records.userId, auth.user.id)];

      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from && to) {
        conditions.push(gte(records.recordDate, from));
        conditions.push(lte(records.recordDate, to));
      }

      const dimension = searchParams.get("dimension");
      if (dimension) {
        conditions.push(eq(records.timeDimension, dimension));
      }

      data = await db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(desc(records.createdAt));
    } else {
      data = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, auth.user.id))
        .orderBy(desc(goals.createdAt));
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有可导出的数据" },
        { status: 404 }
      );
    }

    if (format === "csv") {
      // 将 JSONB 字段序列化
      const flatData = data.map((row) => ({
        ...row,
        learning: row.learning ? JSON.stringify(row.learning) : "",
        work: row.work ? JSON.stringify(row.work) : "",
        life: row.life ? JSON.stringify(row.life) : "",
        health: row.health ? JSON.stringify(row.health) : "",
        mood: row.mood ? JSON.stringify(row.mood) : "",
      }));

      const csv = Papa.unparse(flatData as unknown as Record<string, unknown>[], {
        header: true,
      });

      const filename = `${type}_${new Date().toISOString().split("T")[0]}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`${type === "records" ? "成长记录" : "目标"} 导出`, 14, 20);
      doc.setFontSize(10);

      let y = 30;
      for (const row of data) {
        if (type === "records") {
          const r = row as typeof records.$inferSelect;
          const text = `[${r.recordDate}] ${r.timeDimension} - ${r.summary || "无摘要"}`;
          doc.text(text, 14, y);
        } else {
          const g = row as typeof goals.$inferSelect;
          const text = `[${g.name}] ${g.dimension} - ${g.currentValue}/${g.targetValue} (${g.status})`;
          doc.text(text, 14, y);
        }
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      }

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      const filename = `${type}_${new Date().toISOString().split("T")[0]}.pdf`;
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的格式" },
      { status: 400 }
    );
  } catch (error) {
    console.error("导出失败:", error);
    return NextResponse.json(
      { success: false, error: "导出失败" },
      { status: 500 }
    );
  }
}
```

## 验收标准

- [ ] `src/app/api/export/route.ts` 文件已创建，支持 CSV 和 PDF 导出
- [ ] Records 页面包含导出按钮，点击可下载 CSV/PDF
- [ ] Goals 页面包含导出按钮，点击可下载 CSV/PDF
- [ ] CSV 导出包含完整列标题和 UTF-8 BOM（确保中文在 Excel 中正常显示）
- [ ] PDF 导出包含基本格式（标题 + 数据行）
- [ ] 导出数据受权限控制（仅导出当前用户的数据）
- [ ] 无 TypeScript 类型错误

## 预估工时

1.5 人天

## 依赖

无