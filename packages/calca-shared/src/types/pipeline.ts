/** Pipeline stages for multi-model generation */

export type PipelineStage =
  | "queued"
  | "layout"
  | "images"
  | "compositing"
  | "review"
  | "refining"
  | "done"
  | "error";

export interface PipelineStatus {
  stage: PipelineStage;
  progress: number; // 0-1
  skipped?: boolean;
  reason?: string;
  /** Per-stage detail for the frame checklist, keyed by PIPELINE_STEP_ORDER names. */
  steps?: Partial<Record<PipelineStepName, PipelineStepState>>;
}

/** User-visible pipeline steps, in execution order (summary/collect run after frames complete). */
export type PipelineStepName = "plan" | "layout" | "images" | "review" | "critique";

export type PipelineStepStatus = "pending" | "running" | "success" | "failed";

export interface PipelineStepState {
  status: PipelineStepStatus;
  /** ms epoch when the step last entered `running` */
  startedAt?: number;
  /** total duration once finished */
  elapsedMs?: number;
}

export const PIPELINE_STEP_ORDER: PipelineStepName[] = [
  "plan",
  "layout",
  "images",
  "review",
  "critique",
];

export const PIPELINE_STEP_LABELS: Record<PipelineStepName, string> = {
  critique: "Critique",
  images: "Images",
  layout: "Layout",
  plan: "Plan",
  review: "Review",
};

export const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; progress: number; icon: string }
> = {
  compositing: { label: "Compositing…", progress: 0.65, icon: "🔧" },
  done: { label: "Complete", progress: 1, icon: "✅" },
  error: { label: "Error", progress: 0, icon: "❌" },
  images: { label: "Adding images…", progress: 0.45, icon: "🎨" },
  layout: { label: "Generating layout…", progress: 0.2, icon: "🏗️" },
  queued: { label: "Queued", progress: 0, icon: "⏳" },
  refining: { label: "Preparing next variation…", progress: 0.9, icon: "✨" },
  review: { label: "Reviewing design…", progress: 0.8, icon: "👁️" },
};
