import { z } from 'zod';

export const CritiqueInputSchema = z.object({
  html: z.string(),
  prompt: z.string(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
});

export const CritiqueOutputSchema = z.object({
  critique: z.string(),
});

export type CritiqueInput = z.infer<typeof CritiqueInputSchema>;
export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;
