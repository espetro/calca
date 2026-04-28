import { z } from "zod";

export const LayoutInputSchema = z.object({
  prompt: z.string(),
  concept: z.string().optional(),
  contextImages: z.array(z.string()).optional(),
  critique: z.string().optional(),
  revision: z.boolean().optional(),
  existingHtml: z.string().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
  frameIndex: z.number().optional(),
});

export const LayoutOutputSchema = z.object({
  html: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  comment: z.string().optional(),
});

export type LayoutInput = z.infer<typeof LayoutInputSchema>;
export type LayoutOutput = z.infer<typeof LayoutOutputSchema>;
