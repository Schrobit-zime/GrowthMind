import { z } from "zod";

const TimeDimensionEnum = z.enum([
  "daily", "weekly", "monthly", "semiannual", "annual",
  "morning", "noon", "evening", "custom"
]);

const DimensionSchema = z.record(z.string(), z.unknown()).default({});

export const createRecordSchema = z.object({
  timeDimension: TimeDimensionEnum,
  recordDate: z.string().min(1, "日期不能为空"),
  customLabel: z.string().optional(),
  learning: DimensionSchema,
  work: DimensionSchema,
  life: DimensionSchema,
  health: DimensionSchema,
  mood: DimensionSchema,
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

export const updateRecordSchema = z.object({
  timeDimension: TimeDimensionEnum.optional(),
  recordDate: z.string().min(1).optional(),
  customLabel: z.string().optional(),
  learning: DimensionSchema.optional(),
  work: DimensionSchema.optional(),
  life: DimensionSchema.optional(),
  health: DimensionSchema.optional(),
  mood: DimensionSchema.optional(),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
