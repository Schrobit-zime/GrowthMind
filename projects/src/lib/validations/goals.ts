import { z } from "zod";

const DimensionEnum = z.enum(["learning", "work", "life", "health", "mood"]);
const StatusEnum = z.enum(["active", "completed", "archived"]);

export const createGoalSchema = z.object({
  name: z.string().min(1, "目标名称不能为空").max(200, "目标名称不能超过200字"),
  dimension: DimensionEnum,
  metric: z.string().min(1, "计量单位不能为空").max(50),
  targetValue: z.number().min(0, "目标值不能为负数"),
  currentValue: z.number().min(0).default(0),
  deadline: z.string().nullable().optional(),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dimension: DimensionEnum.optional(),
  metric: z.string().min(1).max(50).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  deadline: z.string().nullable().optional(),
  status: StatusEnum.optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
