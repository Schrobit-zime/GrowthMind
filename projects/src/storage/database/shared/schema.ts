import { pgTable, uuid, text, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Users (extends Supabase auth.users) ───
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Supervision Relationships ───
export const supervisionRelations = pgTable("supervision_relations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: uuid("admin_user_id").notNull(),
  supervisedUserId: uuid("supervised_user_id").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Growth Records ───
export const records = pgTable("records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  timeDimension: text("time_dimension").notNull(), // 'daily' | 'weekly' | 'monthly' | 'semiannual' | 'annual' | 'morning' | 'noon' | 'evening' | 'custom'
  recordDate: text("record_date").notNull(), // ISO date string
  customLabel: text("custom_label"),

  // Dimensions - each stored as JSONB for flexibility
  learning: jsonb("learning").default("{}"),
  work: jsonb("work").default("{}"),
  life: jsonb("life").default("{}"),
  health: jsonb("health").default("{}"),
  mood: jsonb("mood").default("{}"),

  // Mood score for quick filtering
  moodScore: integer("mood_score"),

  // Summary text
  summary: text("summary"),

  // Linked goal
  goalId: uuid("goal_id"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Goals ───
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  dimension: text("dimension").notNull(), // 'learning' | 'work' | 'life' | 'health' | 'mood'
  metric: text("metric").notNull(), // e.g. 'hours', 'count', 'score'
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  deadline: text("deadline"),
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'archived'
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Reminder Rules ───
export const reminderRules = pgTable("reminder_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: uuid("admin_user_id").notNull(),
  supervisedUserId: uuid("supervised_user_id").notNull(),
  ruleType: text("rule_type").notNull(), // 'no_record' | 'goal_lagging' | 'mood_drop' | 'custom'
  condition: jsonb("condition").notNull().default("{}"), // e.g. { "days": 3 } for no_record
  actions: jsonb("actions").notNull().default("[]"), // ['notify_admin', 'notify_user', 'send_email']
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Analysis History ───
export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  timeRange: text("time_range").notNull(), // '7d' | '30d' | '90d' | 'custom'
  dimensions: jsonb("dimensions").notNull().default("[]"),
  analysisType: text("analysis_type").notNull(), // 'trend' | 'assessment' | 'suggestion'
  result: text("result").notNull(), // Markdown content
  modelUsed: text("model_used"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Model Gateway Usage Log ───
export const gatewayUsageLog = pgTable("gateway_usage_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  provider: text("provider").notNull(), // 'openai' | 'claude' | 'zhipu' | 'deepseek'
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  cost: real("cost").notNull().default(0),
  source: text("source").notNull(), // 'analysis' | 'supervision_report' | 'other'
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Email Templates ───
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Health Check ───
export const healthCheck = pgTable("health_check", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
