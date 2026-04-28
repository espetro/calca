import { getLogger } from "@app/logger";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import type { CritiqueOutput } from "./schemas/critique.schema";
import type { ImagesOutput } from "./schemas/images.schema";
import type { LayoutOutput } from "./schemas/layout.schema";
import { PlanOutputSchema } from "./schemas/plan.schema";
import type { ReviewOutput } from "./schemas/review.schema";
import { critiqueStep } from "./steps/critique.step";
import { imagesStep } from "./steps/images.step";
import { layoutStep } from "./steps/layout.step";
import { planStep } from "./steps/plan.step";
import { reviewStep } from "./steps/review.step";
import { summaryStep } from "./steps/summary.step";

const logger = getLogger(["calca", "server", "workflow"]);

function withStepLogging<
  S extends ReturnType<typeof createStep<string, undefined, object, object>>,
>(step: S, stepName: string): S {
  const originalExecute = step.execute;
  step.execute = async (
    context: typeof originalExecute extends (ctx: infer C) => Promise<unknown> ? C : never,
  ) => {
    const start = performance.now();
    logger.info("Pipeline step starting", { step: stepName });
    try {
      const result = await originalExecute(context);
      const elapsed = Math.round(performance.now() - start);
      logger.info("Pipeline step completed", { step: stepName, durationMs: elapsed });
      return result;
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      logger.error("Pipeline step failed", { step: stepName, durationMs: elapsed, error: err });
      throw err;
    }
  };
  return step;
}

const loggedPlanStep = withStepLogging(planStep, "plan");
const loggedSummaryStep = withStepLogging(summaryStep, "summary");

// ── Workflow-level schemas ────────────────────────────────────────────────────

const WorkflowInputSchema = z.object({
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

const FrameResultSchema = z.object({
  html: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string(),
  comment: z.string().optional(),
  critique: z.string().optional(),
});

const FrameOrchestratorOutputSchema = z.object({
  frames: z.array(FrameResultSchema),
  html: z.string(),
  prompt: z.string(),
  labels: z.array(z.string()),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  providerType: z.string().optional(),
});

const WorkflowOutputSchema = z.object({
  frames: z.array(FrameResultSchema),
  summary: z.string().optional(),
});

type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
type FrameResult = z.infer<typeof FrameResultSchema>;

// Mastra step.execute() returns `TOutput | InnerOutput` where InnerOutput
// is the return of suspend(). Since our steps never suspend, we safely
// narrow via this helper.
const unwrap = <T>(result: unknown): T => result as T;

// ── Frame orchestrator step ───────────────────────────────────────────────────
//
// Receives plan output (concepts) and the full workflow input via getInitData().
// Runs the per-frame pipeline (layout → images → review → critique) with
// branching for quick vs sequential mode.

const frameOrchestratorStep = createStep({
  id: "frameOrchestrator",
  description:
    "Runs the per-frame pipeline for each concept. Quick mode = parallel. Sequential mode = sequential with critique loop.",
  inputSchema: PlanOutputSchema,
  outputSchema: FrameOrchestratorOutputSchema,
  execute: async ({ inputData, getInitData, writer, abortSignal }) => {
    const start = performance.now();
    const { concepts } = inputData;
    const init = getInitData<WorkflowInput>();
    const {
      mode,
      prompt,
      model,
      apiKey,
      baseURL,
      providerType,
      geminiKey,
      unsplashKey,
      openaiKey,
      systemPrompt,
      contextImages,
      revision,
      existingHtml,
    } = init;

    const isQuickMode = mode === "quick";
    const total = concepts.length;

    logger.info("Pipeline step starting", { step: "frameOrchestrator", model });

    const runFramePipeline = async (
      concept: { name: string; direction: string },
      index: number,
      previousCritique?: string,
    ): Promise<FrameResult> => {
      const conceptStr = concept.direction ? `${concept.name}: ${concept.direction}` : concept.name;
      let html: string;
      let width: number | undefined;
      let height: number | undefined;
      let comment: string | undefined;

      writer.write({
        type: "workflow-step",
        step: "layout",
        frameIndex: index,
        progress: 0.2 + (index / total) * 0.6,
      });

      {
        const start = performance.now();
        logger.info("Pipeline step starting", { step: "layout", frameIndex: index, model });
        const layoutResult = unwrap<LayoutOutput>(
          await layoutStep.execute({
            inputData: {
              prompt,
              concept: conceptStr,
              critique: previousCritique,
              systemPrompt,
              model,
              apiKey,
              baseURL,
              providerType,
              contextImages,
              revision,
              existingHtml,
              frameIndex: index,
            },
            writer,
            abortSignal,
          } as Parameters<typeof layoutStep.execute>[0]),
        );
        logger.info("Pipeline step completed", {
          step: "layout",
          frameIndex: index,
          durationMs: Math.round(performance.now() - start),
        });
        html = layoutResult.html;
        width = layoutResult.width;
        height = layoutResult.height;
        comment = layoutResult.comment;
      }

      writer.write({
        type: "workflow-step",
        step: "images",
        frameIndex: index,
        progress: 0.4 + (index / total) * 0.6,
      });

      {
        const start = performance.now();
        logger.info("Pipeline step starting", { step: "images", frameIndex: index });
        const imagesResult = unwrap<ImagesOutput>(
          await imagesStep.execute({
            inputData: {
              html,
              geminiKey,
              unsplashKey,
              openaiKey,
              viewport: width && height ? { width, height } : undefined,
            },
            writer,
            abortSignal,
          } as Parameters<typeof imagesStep.execute>[0]),
        );
        logger.info("Pipeline step completed", {
          step: "images",
          frameIndex: index,
          durationMs: Math.round(performance.now() - start),
        });
        html = imagesResult.html;
      }

      if (!isQuickMode) {
        writer.write({
          type: "workflow-step",
          step: "review",
          frameIndex: index,
          progress: 0.7 + (index / total) * 0.3,
        });

        {
          const start = performance.now();
          logger.info("Pipeline step starting", { step: "review", frameIndex: index, model });
          const reviewResult = unwrap<ReviewOutput>(
            await reviewStep.execute({
              inputData: {
                html,
                prompt,
                width,
                height,
                model,
                apiKey,
                baseURL,
                providerType,
                frameIndex: index,
              },
            } as Parameters<typeof reviewStep.execute>[0]),
          );
          logger.info("Pipeline step completed", {
            step: "review",
            frameIndex: index,
            durationMs: Math.round(performance.now() - start),
          });
          html = reviewResult.html;
        }
      }

      let critiqueText: string | undefined;

      if (!isQuickMode) {
        writer.write({
          type: "workflow-step",
          step: "critique",
          frameIndex: index,
          progress: 0.9 + (index / total) * 0.1,
        });

        try {
          const start = performance.now();
          logger.info("Pipeline step starting", { step: "critique", frameIndex: index, model });
          const critiqueResult = unwrap<CritiqueOutput>(
            await critiqueStep.execute({
              inputData: {
                html,
                prompt,
                model,
                apiKey,
                baseURL,
                providerType,
                frameIndex: index,
              },
            } as Parameters<typeof critiqueStep.execute>[0]),
          );
          logger.info("Pipeline step completed", {
            step: "critique",
            frameIndex: index,
            durationMs: Math.round(performance.now() - start),
          });
          critiqueText = critiqueResult.critique;
        } catch {
          // critique is optional — continue without it
        }
      }

      writer.write({
        type: "workflow-step",
        step: "images",
        frameIndex: index,
        progress: 0.4 + (index / total) * 0.6,
      });

      {
        const start = performance.now();
        logger.info("Pipeline step starting", { step: "images", frameIndex: index });
        const imagesResult = unwrap<ImagesOutput>(
          await imagesStep.execute({
            inputData: {
              html: html!,
              geminiKey,
              unsplashKey,
              openaiKey,
              viewport: width! && height! ? { width: width!, height: height! } : undefined,
            },
            writer,
            abortSignal,
          } as Parameters<typeof imagesStep.execute>[0]),
        );
        logger.info("Pipeline step completed", {
          step: "images",
          frameIndex: index,
          durationMs: Math.round(performance.now() - start),
        });
        html = imagesResult.html;
      }

      if (!isQuickMode) {
        writer.write({
          type: "workflow-step",
          step: "review",
          frameIndex: index,
          progress: 0.7 + (index / total) * 0.3,
        });

        {
          const start = performance.now();
          logger.info("Pipeline step starting", { step: "review", frameIndex: index, model });
          const reviewResult = unwrap<ReviewOutput>(
            await reviewStep.execute({
              inputData: {
                html,
                prompt,
                width,
                height,
                model,
                apiKey,
                baseURL,
                providerType,
                frameIndex: index,
              },
            } as Parameters<typeof reviewStep.execute>[0]),
          );
          logger.info("Pipeline step completed", {
            step: "review",
            frameIndex: index,
            durationMs: Math.round(performance.now() - start),
          });
          html = reviewResult.html;
        }
      }

      if (!isQuickMode) {
        writer.write({
          type: "workflow-step",
          step: "critique",
          frameIndex: index,
          progress: 0.9 + (index / total) * 0.1,
        });

        try {
          const start = performance.now();
          logger.info("Pipeline step starting", { step: "critique", frameIndex: index, model });
          const critiqueResult = unwrap<CritiqueOutput>(
            await critiqueStep.execute({
              inputData: {
                html,
                prompt,
                model,
                apiKey,
                baseURL,
                providerType,
                frameIndex: index,
              },
            } as Parameters<typeof critiqueStep.execute>[0]),
          );
          logger.info("Pipeline step completed", {
            step: "critique",
            frameIndex: index,
            durationMs: Math.round(performance.now() - start),
          });
          critiqueText = critiqueResult.critique;
        } catch {
          // critique is optional — continue without it
        }
      }

      writer.write({
        type: "workflow-step",
        step: "frameComplete",
        frameIndex: index,
        progress: (index + 1) / total,
      });

      return {
        html,
        width,
        height,
        label: `Variation ${index + 1}`,
        comment,
        critique: critiqueText,
      };
    };

    // ── Execute frames ─────────────────────────────────────────────────────

    let frames: FrameResult[];

    if (isQuickMode) {
      writer.write({
        type: "workflow-step",
        step: "frameOrchestrator",
        progress: 0.1,
        message: `Running ${total} frames in parallel`,
      });

      const results = await Promise.allSettled(
        concepts.map((concept, i) => runFramePipeline(concept, i)),
      );

      frames = results.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        logger.warn(`Frame ${i + 1} failed:`, r.reason);
        return {
          html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${i + 1} failed</p></div>`,
          label: `Variation ${i + 1}`,
        };
      });
    } else {
      // Sequential mode: iterate one at a time, passing previous critique
      frames = [];
      let previousCritique: string | undefined;

      for (let i = 0; i < concepts.length; i++) {
        if (abortSignal.aborted) break;

        writer.write({
          type: "workflow-step",
          step: "frameOrchestrator",
          frameIndex: i,
          progress: i / total,
          message: `Designing ${i + 1} of ${total}…`,
        });

        try {
          // oxlint-disable-next-line no-await-in-loop
          const result = await runFramePipeline(concepts[i]!, i, previousCritique);
          frames.push(result);
          previousCritique = result.critique;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") throw error;
          logger.warn(`Frame ${i + 1} failed:`, { error });
          frames.push({
            html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${i + 1} failed</p></div>`,
            label: `Variation ${i + 1}`,
          });
        }
      }
    }

    // ── Build output ───────────────────────────────────────────────────────
    const lastFrame = frames[frames.length - 1];
    const labels = frames.map((f) => f.label).filter(Boolean);
    logger.info("Pipeline step completed", {
      step: "frameOrchestrator",
      durationMs: Math.round(performance.now() - start),
    });

    return {
      frames,
      html: lastFrame?.html ?? "",
      prompt,
      labels,
      model,
      apiKey,
      baseURL,
      providerType,
    };
  },
});

// ── Collect results step ──────────────────────────────────────────────────────
//
// Combines frame results (from frameOrchestratorStep) with the summary
// (from summaryStep) into the final workflow output.

const collectResultsStep = createStep({
  id: "collectResults",
  inputSchema: z.object({ summary: z.string() }),
  outputSchema: WorkflowOutputSchema,
  execute: async ({ inputData, getStepResult }) => {
    const frameData = getStepResult(frameOrchestratorStep);
    return {
      frames: frameData.frames,
      summary: inputData.summary,
    };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
//
// Plan → Frame orchestrator (quick/sequential branching) → Summary → Collect

export const designPipeline = createWorkflow({
  id: "designPipeline",
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowOutputSchema,
})
  .then(loggedPlanStep)
  .then(frameOrchestratorStep)
  .then(loggedSummaryStep)
  .then(collectResultsStep)
  .commit();

export {
  WorkflowInputSchema,
  WorkflowOutputSchema,
  FrameOrchestratorOutputSchema,
  FrameResultSchema,
  frameOrchestratorStep,
  collectResultsStep,
};
