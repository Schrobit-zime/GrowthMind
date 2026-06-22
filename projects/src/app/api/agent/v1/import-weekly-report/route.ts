import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { records, goals } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";
import { eq } from "drizzle-orm";

const WEEKLY_DATA = [
  {
    date: "2026-06-15",
    label: "周一",
    learningMinutes: 227,
    learningCredits: 280,
    learningSummary:
      "《国际汉语教学案例分析》笔记+反思 140min；论文视频分析 20min；单词新33复习30；现代汉语复习2页 30min；《要略》卡片4张 7min",
    learningCategories: ["汉语教学", "论文研究", "单词", "现代汉语", "文化要略"],
    healthSummary: "未健身，来月经腰酸",
    moodScore: 5,
    moodSummary: "困，没睡午觉。早上给猫猫惹生气了。",
  },
  {
    date: "2026-06-16",
    label: "周二",
    learningMinutes: 332,
    learningCredits: 332,
    learningSummary:
      "旁听 90min；视频分析 57min；《要略》卡片 20min；单词30+30 40min；现代汉语 35min；考研英语课 90min",
    learningCategories: ["旁听", "论文研究", "文化要略", "单词", "现代汉语", "考研英语"],
    healthSummary: "胃痛头痛，胃口欠佳",
    moodScore: 4,
    moodSummary: "猫猫凶我，有点暴躁。猫猫被我打好多次。",
  },
  {
    date: "2026-06-17",
    label: "周三",
    learningMinutes: 100,
    learningCredits: 100,
    learningSummary: "单词新70复习75 100min",
    learningCategories: ["单词"],
    healthSummary: "感觉还不错，撞到膝盖",
    moodScore: 5,
    moodSummary: "工伤撞到膝盖！猫猫爱抚下手重了打回去了。",
  },
  {
    date: "2026-06-18",
    label: "周四",
    learningMinutes: 415,
    learningCredits: 415,
    learningSummary:
      "单词新29复习23 30min；案例分析笔记整理 270min；旁听 100min；要略卡片49+1 15min",
    learningCategories: ["单词", "汉语教学", "旁听", "文化要略"],
    healthSummary: "胃疼胃口欠佳，晚饭吃的比较多",
    moodScore: 6,
    moodSummary: "比较平静。杨梅好酸，荔枝小番茄樱桃好吃。用棍子打人手感不好。",
  },
  {
    date: "2026-06-19",
    label: "周五",
    learningMinutes: 90,
    learningCredits: 90,
    learningSummary: "案例分析总结反思 30min；机构课程备忘 30min；单词30+30 30min",
    learningCategories: ["汉语教学", "工作", "单词", "健身"],
    healthSummary: "头疼，午饭胃口可以，上肢锻炼+足弓训练",
    moodScore: 6,
    moodSummary: "困。新爱称小娇娇。一大早找不到书包在桌子下。",
  },
  {
    date: "2026-06-20",
    label: "周六",
    learningMinutes: 398,
    learningCredits: 398,
    learningSummary:
      "现代汉语复习8-12页 100min；PPT修订上传 79min；教案约180min；单词30min；要略9min",
    learningCategories: ["现代汉语", "工作", "教案", "单词", "文化要略", "健身"],
    healthSummary: "10个俯卧撑+足弓训练",
    moodScore: 7,
    moodSummary: "写教案写晕了。凉拌牛肉好吃，妹妹拿甜品舒芙蕾香蕉酥芝士火腿派。",
  },
  {
    date: "2026-06-21",
    label: "周日",
    learningMinutes: 186,
    learningCredits: 186,
    learningSummary: "教案未完成 106min；单词新60复习90 80min",
    learningCategories: ["教案", "单词", "健身"],
    healthSummary: "足弓训练",
    moodScore: 5,
    moodSummary: "狗屎教案不想当教师。打雷雷害怕怕。学的好少反思ing。炒榨面好吃。",
  },
];

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  const userId = auth.user.id;
  const results: string[] = [];

  try {
    const totalCredits = WEEKLY_DATA.reduce((s, d) => s + d.learningCredits, 0);

    const [goal] = await db
      .insert(goals)
      .values({
        userId,
        name: "第1周学习任务 (6月15日-6月21日)",
        dimension: "learning",
        metric: "credits",
        targetValue: 3000,
        currentValue: totalCredits,
        deadline: "2026-06-21",
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    results.push(
      `目标: ${totalCredits}/3000 credits (${((totalCredits / 3000) * 100).toFixed(0)}%)`,
    );

    let count = 0;
    for (const day of WEEKLY_DATA) {
      await db.insert(records).values({
        userId,
        timeDimension: "evening",
        recordDate: day.date,
        customLabel: `${day.label} (6月${parseInt(day.date.split("-")[2])}日)`,
        learning: {
          minutes: day.learningMinutes,
          credits: day.learningCredits,
          summary: day.learningSummary,
          categories: day.learningCategories,
        },
        health: { summary: day.healthSummary },
        mood: { summary: day.moodSummary },
        moodScore: day.moodScore,
        summary: day.moodSummary,
        ...(goal ? { goalId: goal.id } : {}),
      });
      count++;
      results.push(`✅ ${day.date} ${day.label} (${day.learningMinutes}min)`);
    }

    return NextResponse.json({
      success: true,
      data: { imported: count, totalDays: WEEKLY_DATA.length, goalId: goal?.id, details: results },
    });
  } catch (error) {
    return handleApiError(error, "导入飞书文档数据");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const result = await db.delete(records).where(eq(records.userId, auth.user.id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error, "删除导入数据");
  }
}
