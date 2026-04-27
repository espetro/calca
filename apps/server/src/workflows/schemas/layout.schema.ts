import { z } from "zod";

export const LayoutInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  concept: z.string().optional(),
  contextImages: z.array(z.string()).optional(),
  critique: z.string().optional(),
  existingHtml: z.string().optional(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
  revision: z.boolean().optional(),
  systemPrompt: z.string().optional(),
});

export const LayoutOutputSchema = z.object({
  comment: z.string().optional(),
  height: z.number().optional(),
  html: z.string(),
  width: z.number().optional(),
});

export type LayoutInput = z.infer<typeof LayoutInputSchema>;
export type LayoutOutput = z.infer<typeof LayoutOutputSchema>;
