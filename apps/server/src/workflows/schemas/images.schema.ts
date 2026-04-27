import { z } from "zod";

export const ImagesInputSchema = z.object({
  html: z.string(),
  geminiKey: z.string().optional(),
  unsplashKey: z.string().optional(),
  openaiKey: z.string().optional(),
  viewport: z.object({ width: z.number(), height: z.number() }).optional(),
});

export const ImagesOutputSchema = z.object({
  html: z.string(),
});

export type ImagesInput = z.infer<typeof ImagesInputSchema>;
export type ImagesOutput = z.infer<typeof ImagesOutputSchema>;
