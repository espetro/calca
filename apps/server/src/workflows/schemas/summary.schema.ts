import { z } from "zod";

export const SummaryInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  html: z.string(),
  labels: z.array(z.string()).optional(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
});

export const SummaryOutputSchema = z.object({
  summary: z.string(),
});

export type SummaryInput = z.infer<typeof SummaryInputSchema>;
export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
