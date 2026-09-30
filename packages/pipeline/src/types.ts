import type { Tracer } from "@opentelemetry/api";
import { z } from "zod";

import type { TokenAggregator } from "./telemetry";

// ── Workflow I/O ────────────────────────────────────────────────────────────

export const WorkflowInputSchema = z.object({
  prompt: z.string(),
  mode: z.enum(["quick", "sequential"]),
  conceptCount: z.number().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
  geminiKey: z.string().optional(),
  unsplashKey: z.string().optional(),
  openaiKey: z.string().optional(),
  systemPrompt: z.string().optional(),
  contextImages: z.array(z.string()).optional(),
  revision: z.string().optional(),
  existingHtml: z.string().optional(),
});

export const FrameResultSchema = z.object({
  html: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string(),
  comment: z.string().optional(),
  critique: z.string().optional(),
});

export const WorkflowOutputSchema = z.object({
  frames: z.array(FrameResultSchema),
  summary: z.string().optional(),
});

export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type WorkflowOutput = z.infer<typeof WorkflowOutputSchema>;
export type FrameResult = z.infer<typeof FrameResultSchema>;

// ── Plan ────────────────────────────────────────────────────────────────────

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

// ── Layout ──────────────────────────────────────────────────────────────────

export const LayoutInputSchema = z.object({
  prompt: z.string(),
  concept: z.string().optional(),
  contextImages: z.array(z.string()).optional(),
  critique: z.string().optional(),
  revision: z.string().optional(),
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

// ── Images ──────────────────────────────────────────────────────────────────

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

// ── Review ──────────────────────────────────────────────────────────────────

export const ReviewInputSchema = z.object({
  html: z.string(),
  prompt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
  frameIndex: z.number().optional(),
});

export const ReviewOutputSchema = z.object({
  html: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// ── Critique ────────────────────────────────────────────────────────────────

export const CritiqueInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  html: z.string(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
  frameIndex: z.number().optional(),
});

export const CritiqueOutputSchema = z.object({
  critique: z.string(),
});

export type CritiqueInput = z.infer<typeof CritiqueInputSchema>;
export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;

// ── Summary ─────────────────────────────────────────────────────────────────

export const SummaryInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  html: z.string(),
  labels: z.array(z.string()).optional(),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
});

export const SummaryOutputSchema = z.object({
  summary: z.string(),
});

export type SummaryInput = z.infer<typeof SummaryInputSchema>;
export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;

// ── Step interface ──────────────────────────────────────────────────────────

export type StepName =
  | "plan"
  | "layout"
  | "images"
  | "review"
  | "critique"
  | "summary"
  | "frameOrchestrator"
  | "collectResults"
  | "frameComplete";

export type PipelineEvent =
  | {
      type: "step";
      step: StepName;
      status: "running" | "success" | "failed";
      frameIndex?: number;
      output?: unknown;
    }
  | { type: "frame"; frameIndex: number; frame: FrameResult }
  | { type: "done"; output: WorkflowOutput }
  | { type: "error"; message: string }
  | { type: "abort" };

export interface PipelineContext {
  signal: AbortSignal;
  emit: (event: PipelineEvent) => void;
  logger: Logger;
}

export interface StepContext {
  signal: AbortSignal;
  emit: (event: PipelineEvent) => void;
  logger: Logger;
  tracer?: Tracer;
  tokenUsage?: TokenAggregator;
}

export type Step<I, O> = (input: I, ctx: StepContext) => Promise<O>;

export interface Logger {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}
