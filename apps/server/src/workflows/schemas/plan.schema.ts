import { z } from "zod";

export const PlanInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
});

export const ConceptSchema = z.object({
  direction: z.string(),
  name: z.string(),
});

export const PlanOutputSchema = z.object({
  concepts: z.array(ConceptSchema),
  count: z.number(),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
