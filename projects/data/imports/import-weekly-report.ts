/**
 * 导入脚本：将飞书文档"宝宝的汇报"解析后的数据写入 GrowthMind 数据库
 *
 * 使用方法：
 *   npx tsx data/imports/import-weekly-report.ts
 *
 * 需要 DATABASE_URL 或 COZE_SUPABASE_SERVICE_ROLE_KEY 环境变量
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { records, goals } from "../../src/storage/database/shared/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);

const WEEKLY_GOAL = {
  name: "第1周学习任务 (6月15日-6月21日)",
  dimension: "learning" as const,
  metric: "credits",
  targetValue: 3000,
  currentValue: 0,
  status: "active" as const,
  deadline: "2026-06-21",
};

interface DayRecord {
  date: string;
  dayLabel: string;
  learningSummary: string;
  learningMinutes: number;
  learningCredits: number;
  learningCategories: string[];
  healthSummary: string;
  moodScore: number;
  moodSummary: string;
}

const WEEKLY_DATA: DayRecord[] = [
  {
    date: "2026-06-15",
    dayLabel: "周一",
    learningSummary:
      "《国际汉语教学案例分析》笔记总结+课后反思 140min；论文视频分析 20min；单词新学33复习30；现代汉语复习2页 30min；《中国文化要略》卡片4张 7min",
    learningMinutes: 227,
    learningCredits: 280,
    learningCategories: ["汉语教学", "论文研究", "单词", "现代汉语", "文化要略"],
    healthSummary: "未健身，来月经腰酸",
    moodScore: 5,
    moodSummary: "困，很困，没睡午觉。早上给猫猫惹生气了。",
  },
  {
    date: "2026-06-16",
    dayLabel: "周二",
    learningSummary:
      "旁听 90min；视频分析 57min；《要略》卡片 20min；单词新30复习30 40min；现代汉语 35min；考研英语课 90min",
    learningMinutes: 332,
    learningCredits: 332,
    learningCategories: ["旁听", "论文研究", "文化要略", "单词", "现代汉语", "考研英语"],
    healthSummary: "胃痛头痛，胃口欠佳，午饭仅一半，晚饭只吃了几口",
    moodScore: 4,
    moodSummary: "猫猫凶我，有点暴躁。可怜猫猫被我打好多次。",
  },
  {
    date: "2026-06-17",
    dayLabel: "周三",
    learningSummary: "单词新学70复习75 100min",
    learningMinutes: 100,
    learningCredits: 100,
    learningCategories: ["单词"],
    healthSummary: "感觉还不错。撞到膝盖了。",
    moodScore: 5,
    moodSummary: "工伤！撞到膝盖了。猫猫爱的抚摸下手重了，我打回去了。",
  },
  {
    date: "2026-06-18",
    dayLabel: "周四",
    learningSummary:
      "单词新29复习23 30min；《案例分析》笔记整理 270min；旁听 100min；《要略》卡片复习49新1 15min",
    learningMinutes: 415,
    learningCredits: 415,
    learningCategories: ["单词", "汉语教学", "旁听", "文化要略"],
    healthSummary: "胃疼，胃口欠佳。晚饭吃的还比较多。",
    moodScore: 6,
    moodSummary: "比较平静，午睡睡着了。杨梅好酸，荔枝小番茄樱桃好吃。",
  },
  {
    date: "2026-06-19",
    dayLabel: "周五",
    learningSummary:
      "《案例分析》总结反思 30min；机构课程备忘 30min；单词新30复习30 30min；上肢锻炼+足弓训练",
    learningMinutes: 90,
    learningCredits: 90,
    learningCategories: ["汉语教学", "工作", "单词", "健身"],
    healthSummary: "有点头疼，午饭胃口还可以。完成上肢锻炼，足弓训练。",
    moodScore: 6,
    moodSummary: "困。正式决定新爱称'小娇娇'。带一堆东西回家辛苦了。",
  },
  {
    date: "2026-06-20",
    dayLabel: "周六",
    learningSummary:
      "现代汉语复习8-12页 100min；PPT修订上传 79min；教案180min；单词30min；要略9min；10个俯卧撑+足弓训练",
    learningMinutes: 398,
    learningCredits: 398,
    learningCategories: ["现代汉语", "工作", "教案", "单词", "文化要略", "健身"],
    healthSummary: "做了10个俯卧撑，足弓训练",
    moodScore: 7,
    moodSummary: "写教案写晕了。凉拌牛肉好吃，妹妹拿甜品进来，舒芙蕾香蕉酥芝士火腿派爽哉。",
  },
  {
    date: "2026-06-21",
    dayLabel: "周日",
    learningSummary: "教案（未完成）106min；单词新60复习90 80min；足弓训练",
    learningMinutes: 186,
    learningCredits: 186,
    learningCategories: ["教案", "单词", "健身"],
    healthSummary: "足弓训练",
    moodScore: 5,
    moodSummary: "狗屎教案不想当教师。打雷雷害怕怕。学的好少反思ing。炒榨面好吃，李子很糟糕。",
  },
];

// 计算实际累计 credits
const totalCredits = WEEKLY_DATA.reduce((sum, d) => sum + d.learningCredits, 0);
const totalMinutes = WEEKLY_DATA.reduce((sum, d) => sum + d.learningMinutes, 0);

async function main() {
  // 需要从环境变量或参数获取目标用户 ID
  const targetUserId = process.env.TARGET_USER_ID;

  if (!targetUserId) {
    console.log("⚠️  TARGET_USER_ID 未设置，使用第一个活跃用户");
    console.log("   设置方式: TARGET_USER_ID=<uuid> npx tsx data/imports/import-weekly-report.ts");
    console.log("");
  }

  console.log("📊 第1周数据统计：");
  console.log(`   总天数: ${WEEKLY_DATA.length}`);
  console.log(`   总学习时长: ${totalMinutes} 分钟`);
  console.log(`   总 Credits: ${totalCredits} / ${WEEKLY_GOAL.targetValue}`);
  console.log(`   完成率: ${((totalCredits / WEEKLY_GOAL.targetValue) * 100).toFixed(0)}%`);
  console.log("");

  if (!targetUserId) {
    console.log("💡 跳过数据库写入（未指定用户）。");
    console.log("");
    console.log("   Agent API 方式（推荐）：");
    console.log(`   curl -X POST http://localhost:3001/api/agent/v1/goals \\
     -H "Authorization: Bearer <token>" \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(WEEKLY_GOAL)}'`);
    console.log("");
    console.log("   然后对每天执行：");
    console.log(`   curl -X POST http://localhost:3001/api/agent/v1/records \\
     -H "Authorization: Bearer <token>" \\
     -H "Content-Type: application/json" \\
     -d '<day_record>'`);
    await pool.end();
    return;
  }

  // 1. 创建周目标
  console.log("🎯 创建周目标...");
  const goalData = {
    ...WEEKLY_GOAL,
    userId: targetUserId,
    currentValue: totalCredits,
  };
  let goal;
  try {
    const existing = await db.select().from(goals).where(eq(goals.userId, targetUserId)).limit(1);
    if (existing.length > 0) {
      goal = existing[0];
      console.log(`   目标已存在: ${goal.name}`);
    } else {
      const [newGoal] = await db.insert(goals).values(goalData).returning();
      goal = newGoal;
      console.log(`   ✅ 已创建: ${goal.name}`);
    }
  } catch (err: unknown) {
    console.error("   创建目标失败:", (err as Error).message);
  }

  // 2. 逐天创建记录
  let inserted = 0;
  for (const day of WEEKLY_DATA) {
    try {
      await db.insert(records).values({
        userId: targetUserId,
        timeDimension: "daily",
        recordDate: day.date,
        customLabel: `${day.dayLabel} (6月${parseInt(day.date.split("-")[2])}日)`,
        learning: {
          minutes: day.learningMinutes,
          credits: day.learningCredits,
          summary: day.learningSummary,
          categories: day.learningCategories,
        },
        health: {
          summary: day.healthSummary,
        },
        mood: {
          summary: day.moodSummary,
        },
        moodScore: day.moodScore,
        summary: day.moodSummary,
        ...(goal ? { goalId: goal.id } : {}),
      });
      inserted++;
      console.log(
        `   ✅ ${day.date} ${day.dayLabel} (${day.learningMinutes}min, ${day.learningCredits}cr)`,
      );
    } catch (err: unknown) {
      console.error(`   ❌ ${day.date}: ${(err as Error).message}`);
    }
  }

  console.log("");
  console.log(`✅ 导入完成: ${inserted}/${WEEKLY_DATA.length} 天`);
  console.log(
    `   目标 Credits: ${totalCredits}/${WEEKLY_GOAL.targetValue} (${((totalCredits / WEEKLY_GOAL.targetValue) * 100).toFixed(0)}%)`,
  );

  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
