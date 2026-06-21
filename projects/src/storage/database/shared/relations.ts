import { relations } from "drizzle-orm/relations";
import {
  profiles,
  records,
  goals,
  supervisionRelations,
  reminderRules,
  analysisHistory,
  gatewayUsageLog,
  emailTemplates,
} from "./schema";

// profiles 一对多关联
export const profilesRelations = relations(profiles, ({ many }) => ({
  records: many(records),
  goals: many(goals),
  supervisedRelations: many(supervisionRelations, { relationName: "supervisor" }),
  beingSupervised: many(supervisionRelations, { relationName: "supervised" }),
  reminderRules: many(reminderRules),
  analysisHistory: many(analysisHistory),
  gatewayUsageLogs: many(gatewayUsageLog),
  emailTemplates: many(emailTemplates),
}));

// records 多对一关联
export const recordsRelations = relations(records, ({ one }) => ({
  user: one(profiles, { fields: [records.userId], references: [profiles.userId] }),
  goal: one(goals, { fields: [records.goalId], references: [goals.id] }),
}));

// goals 关联
export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(profiles, { fields: [goals.userId], references: [profiles.userId] }),
  records: many(records),
}));

// supervisionRelations 双向关联
export const supervisionRelationsRelations = relations(supervisionRelations, ({ one }) => ({
  supervisor: one(profiles, {
    fields: [supervisionRelations.adminUserId],
    references: [profiles.userId],
    relationName: "supervisor",
  }),
  supervised: one(profiles, {
    fields: [supervisionRelations.supervisedUserId],
    references: [profiles.userId],
    relationName: "supervised",
  }),
}));

// reminderRules 关联
export const reminderRulesRelations = relations(reminderRules, ({ one }) => ({
  admin: one(profiles, { fields: [reminderRules.adminUserId], references: [profiles.userId] }),
  supervisedUser: one(profiles, {
    fields: [reminderRules.supervisedUserId],
    references: [profiles.userId],
  }),
}));

// analysisHistory 关联
export const analysisHistoryRelations = relations(analysisHistory, ({ one }) => ({
  user: one(profiles, { fields: [analysisHistory.userId], references: [profiles.userId] }),
}));

// gatewayUsageLog 关联
export const gatewayUsageLogRelations = relations(gatewayUsageLog, ({ one }) => ({
  user: one(profiles, { fields: [gatewayUsageLog.userId], references: [profiles.userId] }),
}));

// emailTemplates 关联
export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  creator: one(profiles, { fields: [emailTemplates.createdBy], references: [profiles.userId] }),
}));
