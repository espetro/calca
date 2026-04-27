import { z } from "zod";

export const ReviewInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  height: z.number().optional(),
  html: z.string(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
  width: z.number().optional(),
});

export const ReviewOutputSchema = z.object({
  height: z.number().optional(),
  html: z.string(),
  width: z.number().optional(),
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
