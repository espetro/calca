import { z } from "zod";

export const SummarySchema = z.object({
  title: z.string().min(1).max(80),
  rationale: z.string().min(1).max(300),
});

export const SummaryParsedSchema = SummarySchema;

export const validateSummary = (raw: unknown) => SummaryParsedSchema.parse(raw);

export type SummaryOutput = z.infer<typeof SummarySchema>;
