import { z } from "zod";

export const PlanInputSchema = z.object({
  prompt: z.string(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
});

export const ConceptSchema = z.object({
  name: z.string(),
  direction: z.string(),
});

export const PlanOutputSchema = z.object({
  count: z.number(),
  concepts: z.array(ConceptSchema),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
