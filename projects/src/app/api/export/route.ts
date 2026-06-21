import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { records, goals } from "@/storage/database/shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import Papa from "papaparse";
import { jsPDF } from "jspdf";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "records" | "goals";
    const format = searchParams.get("format") as "csv" | "pdf";

    if (
      !type ||
      !format ||
      !["records", "goals"].includes(type) ||
      !["csv", "pdf"].includes(format)
    ) {
      return NextResponse.json(
        { success: false, error: "参数无效" },
        { status: 400 }
      );
    }

    let data: any[];

    if (type === "records") {
      const conditions = [eq(records.userId, auth.user.id)];
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from) conditions.push(gte(records.recordDate, from));
      if (to) conditions.push(lte(records.recordDate, to));

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

    if (!data.length) {
      return NextResponse.json(
        { success: false, error: "没有可导出的数据" },
        { status: 404 }
      );
    }

    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const flat = data.map((r) => {
        if (type === "records") {
          return {
            ...r,
            learning: r.learning ? JSON.stringify(r.learning) : "",
            work: r.work ? JSON.stringify(r.work) : "",
            life: r.life ? JSON.stringify(r.life) : "",
            health: r.health ? JSON.stringify(r.health) : "",
            mood: r.mood ? JSON.stringify(r.mood) : "",
          };
        }
        return r;
      });

      const csv = Papa.unparse(flat, { header: true });
      return new NextResponse("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}_${dateStr}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(
        `${type === "records" ? "成长记录" : "目标"} 导出`,
        14,
        20
      );
      doc.setFontSize(10);

      let y = 30;
      for (const row of data) {
        const text =
          type === "records"
            ? `[${row.recordDate}] ${row.timeDimension} - ${row.summary || "无摘要"}`
            : `[${row.name}] ${row.dimension} - ${row.currentValue}/${row.targetValue} (${row.status})`;

        const lines = doc.splitTextToSize(text, 180);
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 14, y);
          y += 7;
        }
      }

      const buf = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}_${dateStr}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的格式" },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, "导出数据");
  }
}
