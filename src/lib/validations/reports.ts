import { z } from "zod";

/**
 * Validation schemas for report submissions (Memos and EODs)
 */

/**
 * Base schema for all report types
 */
const baseReportSchema = z.object({
  projectId: z.string().uuid().or(z.string()),
  userId: z.string().uuid().or(z.string()),
  reportDate: z.string().or(z.date()),
});

/**
 * EOD report validation schema
 */
export const eodSchema = baseReportSchema.extend({
  clientUpdate: z.string().optional(),
  actualUpdate: z.string().min(1, "Internal update required"),
  hoursSpent: z.number().min(0.25, "Minimum 0.25 hours").max(24, "Maximum 24 hours").optional(),
});

/**
 * Memo validation schema
 */
export const memoSchema = baseReportSchema.extend({
  memoContent: z.string().min(1, "Memo content required"),
  memoType: z.string().optional().default("short"),
});

export type EODInput = z.infer<typeof eodSchema>;
export type MemoInput = z.infer<typeof memoSchema>;
