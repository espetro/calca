import { z } from "zod";

export const ImagesInputSchema = z.object({
  geminiKey: z.string().optional(),
  html: z.string(),
  openaiKey: z.string().optional(),
  unsplashKey: z.string().optional(),
  viewport: z.object({ height: z.number(), width: z.number() }).optional(),
});

export const ImagesOutputSchema = z.object({
  html: z.string(),
});

export type ImagesInput = z.infer<typeof ImagesInputSchema>;
export type ImagesOutput = z.infer<typeof ImagesOutputSchema>;
