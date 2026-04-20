import { z } from 'zod';

export const SummaryInputSchema = z.object({
  html: z.string(),
  prompt: z.string(),
  labels: z.array(z.string()).optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
});

export const SummaryOutputSchema = z.object({
  summary: z.string(),
});

export type SummaryInput = z.infer<typeof SummaryInputSchema>;
export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
