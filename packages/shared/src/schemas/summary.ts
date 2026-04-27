import { z } from "zod";

export const SummarySchema = z.object({
  rationale: z.string().min(1).max(300),
  title: z.string().min(1).max(80),
});

export const SummaryParsedSchema = SummarySchema;

export const validateSummary = (raw: unknown) => SummaryParsedSchema.parse(raw);

export type SummaryOutput = z.infer<typeof SummarySchema>;
