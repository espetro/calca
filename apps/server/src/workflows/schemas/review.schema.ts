import { z } from 'zod';

export const ReviewInputSchema = z.object({
  html: z.string(),
  prompt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
});

export const ReviewOutputSchema = z.object({
  html: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
