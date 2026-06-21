import { z } from "zod";

const RuleTypeEnum = z.enum(["no_record", "goal_lagging", "mood_drop", "custom"]);

export const createSupervisionSchema = z.object({
  supervisedUserId: z.string().uuid("用户ID格式无效"),
});

export const createReminderRuleSchema = z.object({
  supervisedUserId: z.string().uuid("用户ID格式无效"),
  ruleType: RuleTypeEnum,
  condition: z.record(z.string(), z.unknown()).default({}),
  actions: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

export const updateReminderRuleSchema = z.object({
  ruleType: RuleTypeEnum.optional(),
  condition: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export type CreateSupervisionInput = z.infer<typeof createSupervisionSchema>;
export type CreateReminderRuleInput = z.infer<typeof createReminderRuleSchema>;
export type UpdateReminderRuleInput = z.infer<typeof updateReminderRuleSchema>;
