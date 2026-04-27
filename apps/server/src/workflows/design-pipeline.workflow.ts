import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { getLogger } from "@app/logger";

import { planStep } from "./steps/plan.step";
import { layoutStep } from "./steps/layout.step";
import { imagesStep } from "./steps/images.step";
import { reviewStep } from "./steps/review.step";
import { critiqueStep } from "./steps/critique.step";
import { summaryStep } from "./steps/summary.step";
import { PlanOutputSchema } from "./schemas/plan.schema";
import type { LayoutOutput } from "./schemas/layout.schema";
import type { ImagesOutput } from "./schemas/images.schema";
import type { ReviewOutput } from "./schemas/review.schema";
import type { CritiqueOutput } from "./schemas/critique.schema";

const logger = getLogger(["calca", "server", "workflow"]);

// ── Workflow-level schemas ────────────────────────────────────────────────────

const WorkflowInputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  conceptCount: z.number().optional(),
  contextImages: z.array(z.string()).optional(),
  existingHtml: z.string().optional(),
  geminiKey: z.string().optional(),
  mode: z.enum(["quick", "sequential"]),
  model: z.string().optional(),
  openaiKey: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
  revision: z.string().optional(),
  systemPrompt: z.string().optional(),
  unsplashKey: z.string().optional(),
});

const FrameResultSchema = z.object({
  comment: z.string().optional(),
  critique: z.string().optional(),
  height: z.number().optional(),
  html: z.string(),
  label: z.string(),
  width: z.number().optional(),
});

const FrameOrchestratorOutputSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  frames: z.array(FrameResultSchema),
  html: z.string(),
  labels: z.array(z.string()),
  model: z.string().optional(),
  prompt: z.string(),
  providerType: z.string().optional(),
});

const WorkflowOutputSchema = z.object({
  frames: z.array(FrameResultSchema),
  summary: z.string().optional(),
});

type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
type FrameResult = z.infer<typeof FrameResultSchema>;

// Mastra step.execute() returns `TOutput | InnerOutput` where InnerOutput
// Is the return of suspend(). Since our steps never suspend, we safely
// Narrow via this helper.
const unwrap = <T>(result: unknown): T => result as T;

// ── Frame orchestrator step ───────────────────────────────────────────────────
//
// Receives plan output (concepts) and the full workflow input via getInitData().
// Runs the per-frame pipeline (layout → images → review → critique) with
// Branching for quick vs sequential mode.

const frameOrchestratorStep = createStep({
  description:
    "Runs the per-frame pipeline for each concept. Quick mode = parallel. Sequential mode = sequential with critique loop.",
  execute: async ({ inputData, getInitData, writer, abortSignal }) => {
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

    // ── Per-frame pipeline ──────────────────────────────────────────────────

    const runFramePipeline = async (
      concept: { name: string; direction: string },
      index: number,
      previousCritique?: string,
    ): Promise<FrameResult> => {
      const conceptStr = concept.direction ? `${concept.name}: ${concept.direction}` : concept.name;

      // ── Layout ──────────────────────────────────────────────────────────
      writer.write({
        frameIndex: index,
        progress: 0.2 + (index / total) * 0.6,
        step: "layout",
        type: "workflow-step",
      });

      const layoutResult = unwrap<LayoutOutput>(
        await layoutStep.execute({
          abortSignal,
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
          },
          writer,
        } as Parameters<typeof layoutStep.execute>[0]),
      );

      let {html} = layoutResult;
      const {width} = layoutResult;
      const {height} = layoutResult;
      const {comment} = layoutResult;

      // ── Images ──────────────────────────────────────────────────────────
      writer.write({
        frameIndex: index,
        progress: 0.4 + (index / total) * 0.6,
        step: "images",
        type: "workflow-step",
      });

      const imagesResult = unwrap<ImagesOutput>(
        await imagesStep.execute({
          abortSignal,
          inputData: {
            html,
            geminiKey,
            unsplashKey,
            openaiKey,
            viewport: width && height ? { width, height } : undefined,
          },
          writer,
        } as Parameters<typeof imagesStep.execute>[0]),
      );

      ({ html } = imagesResult);

      // ── Review (skipped in quick mode) ──────────────────────────────────
      if (!isQuickMode) {
        writer.write({
          frameIndex: index,
          progress: 0.7 + (index / total) * 0.3,
          step: "review",
          type: "workflow-step",
        });

        const reviewResult = unwrap<ReviewOutput>(
          await reviewStep.execute({
            inputData: {
              apiKey,
              baseURL,
              height,
              html,
              model,
              prompt,
              providerType,
              width,
            },
          } as Parameters<typeof reviewStep.execute>[0]),
        );

        ({ html } = reviewResult);
      }

      // ── Critique (sequential mode only) ────────────────────────────────
      let critiqueText: string | undefined;

      if (!isQuickMode) {
        writer.write({
          frameIndex: index,
          progress: 0.9 + (index / total) * 0.1,
          step: "critique",
          type: "workflow-step",
        });

        try {
          const critiqueResult = unwrap<CritiqueOutput>(
            await critiqueStep.execute({
              inputData: {
                apiKey,
                baseURL,
                html,
                model,
                prompt,
                providerType,
              },
            } as Parameters<typeof critiqueStep.execute>[0]),
          );

          critiqueText = critiqueResult.critique;
        } catch {
          // Critique is optional — continue without it
        }
      }

      writer.write({
        frameIndex: index,
        progress: (index + 1) / total,
        step: "frameComplete",
        type: "workflow-step",
      });

      return {
        comment,
        critique: critiqueText,
        height,
        html,
        label: `Variation ${index + 1}`,
        width,
      };
    };

    // ── Execute frames ─────────────────────────────────────────────────────

    let frames: FrameResult[];

    if (isQuickMode) {
      writer.write({
        message: `Running ${total} frames in parallel`,
        progress: 0.1,
        step: "frameOrchestrator",
        type: "workflow-step",
      });

      const results = await Promise.allSettled(
        concepts.map((concept, i) => runFramePipeline(concept, i)),
      );

      frames = results.map((r, i) => {
        if (r.status === "fulfilled") {return r.value;}
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
        if (abortSignal.aborted) {break;}

        writer.write({
          frameIndex: i,
          message: `Designing ${i + 1} of ${total}…`,
          progress: i / total,
          step: "frameOrchestrator",
          type: "workflow-step",
        });

        try {
          const result = await runFramePipeline(concepts[i]!, i, previousCritique);
          frames.push(result);
          previousCritique = result.critique;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {throw error;}
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

    return {
      apiKey,
      baseURL,
      frames,
      html: lastFrame?.html ?? "",
      labels,
      model,
      prompt,
      providerType,
    };
  },
  id: "frameOrchestrator",
  inputSchema: PlanOutputSchema,
  outputSchema: FrameOrchestratorOutputSchema,
});

// ── Collect results step ──────────────────────────────────────────────────────
//
// Combines frame results (from frameOrchestratorStep) with the summary
// (from summaryStep) into the final workflow output.

const collectResultsStep = createStep({
  execute: async ({ inputData, getStepResult }) => {
    const frameData = getStepResult(frameOrchestratorStep);
    return {
      frames: frameData.frames,
      summary: inputData.summary,
    };
  },
  id: "collectResults",
  inputSchema: z.object({ summary: z.string() }),
  outputSchema: WorkflowOutputSchema,
});

// ── Workflow definition ───────────────────────────────────────────────────────
//
// Plan → Frame orchestrator (quick/sequential branching) → Summary → Collect

export const designPipeline = createWorkflow({
  id: "designPipeline",
  inputSchema: WorkflowInputSchema,
  outputSchema: WorkflowOutputSchema,
})
  .then(planStep)
  .then(frameOrchestratorStep)
  .then(summaryStep)
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
