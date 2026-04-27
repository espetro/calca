import { z } from "zod";

export const CritiqueInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  html: z.string(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
});

export const CritiqueOutputSchema = z.object({
  critique: z.string(),
});

export type CritiqueInput = z.infer<typeof CritiqueInputSchema>;
export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;
