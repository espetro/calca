import { critiqueStep } from "./steps/critique.step";
import { imagesStep } from "./steps/images.step";
import { layoutStep } from "./steps/layout.step";
import { planStep } from "./steps/plan.step";
import { reviewStep } from "./steps/review.step";
import { summaryStep } from "./steps/summary.step";
import { getPipelineTracer, tokenAggregator, withActiveFrameSpan, wrapStep } from "./telemetry";
import type {
  FrameResult,
  Logger,
  PipelineContext,
  PipelineEvent,
  PlanOutput,
  StepContext,
  WorkflowInput,
  WorkflowOutput,
} from "./types";

export type { PipelineEvent };

function makeContext(
  signal: AbortSignal,
  emit: (event: PipelineEvent) => void,
  logger: Logger,
): StepContext {
  return {
    signal,
    emit,
    logger,
    tracer: getPipelineTracer(),
    tokenUsage: tokenAggregator,
  };
}

export async function designPipeline(
  input: WorkflowInput,
  ctx: PipelineContext,
): Promise<WorkflowOutput> {
  const stepCtx = makeContext(ctx.signal, ctx.emit, ctx.logger);

  stepCtx.emit({ type: "step", step: "plan", status: "running" });
  const plan = await wrapStep("plan", async (ctx) => planStep(input, ctx), stepCtx);
  stepCtx.emit({ type: "step", step: "plan", status: "success", output: plan });

  const frames: FrameResult[] = [];
  if (input.mode === "quick") {
    const results = await Promise.allSettled(
      plan.concepts.map((concept, i) => runFrame(concept, i, undefined, input, stepCtx)),
    );
    frames.push(...results.map((r, i) => (r.status === "fulfilled" ? r.value : errorFrame(i))));
  } else {
    let prev: string | undefined;
    for (let i = 0; i < plan.concepts.length; i++) {
      if (ctx.signal.aborted) break;
      const f = await runFrame(plan.concepts[i]!, i, prev, input, stepCtx);
      frames.push(f);
      prev = f.critique;
    }
  }

  stepCtx.emit({ type: "step", step: "frameOrchestrator", status: "success", output: { frames } });

  const lastFrame = frames[frames.length - 1];
  const summaryInput = {
    ...input,
    html: lastFrame?.html ?? "",
    labels: frames.map((f) => f.label),
  };

  stepCtx.emit({ type: "step", step: "summary", status: "running" });
  const summary = await wrapStep("summary", async (ctx) => summaryStep(summaryInput, ctx), stepCtx);
  stepCtx.emit({ type: "step", step: "summary", status: "success", output: summary });

  const output: WorkflowOutput = { frames, summary: summary.summary };
  stepCtx.emit({
    type: "step",
    step: "collectResults",
    status: "success",
    output,
  });
  stepCtx.emit({ type: "done", output });
  return output;
}

async function runFrame(
  concept: { name: string; direction: string },
  i: number,
  prevCritique: string | undefined,
  input: WorkflowInput,
  ctx: StepContext,
): Promise<FrameResult> {
  return withActiveFrameSpan(i, concept.name, async () => {
    const conceptStr = concept.direction ? `${concept.name}: ${concept.direction}` : concept.name;

    ctx.emit({ type: "step", step: "layout", status: "running", frameIndex: i });
    const { html, width, height, comment } = await wrapStep(
      "layout",
      async (stepCtx) =>
        layoutStep(
          {
            ...input,
            concept: conceptStr,
            critique: prevCritique,
            frameIndex: i,
          },
          stepCtx,
        ),
      ctx,
    );
    ctx.emit({
      type: "step",
      step: "layout",
      status: "success",
      frameIndex: i,
      output: { html, width, height, comment },
    });

    ctx.emit({ type: "step", step: "images", status: "running", frameIndex: i });
    const { html: imaged } = await wrapStep(
      "images",
      async (stepCtx) =>
        imagesStep(
          {
            html,
            geminiKey: input.geminiKey,
            unsplashKey: input.unsplashKey,
            openaiKey: input.openaiKey,
            viewport: width && height ? { width, height } : undefined,
          },
          stepCtx,
        ),
      ctx,
    );
    ctx.emit({
      type: "step",
      step: "images",
      status: "success",
      frameIndex: i,
      output: { html: imaged },
    });

    let final = imaged;
    let critique: string | undefined;
    if (input.mode !== "quick") {
      ctx.emit({ type: "step", step: "review", status: "running", frameIndex: i });
      const reviewed = await wrapStep(
        "review",
        async (stepCtx) =>
          reviewStep(
            {
              html: final,
              prompt: input.prompt,
              width,
              height,
              model: input.model,
              apiKey: input.apiKey,
              baseURL: input.baseURL,
              providerType: input.providerType,
              frameIndex: i,
            },
            stepCtx,
          ),
        ctx,
      );
      final = reviewed.html;
      ctx.emit({
        type: "step",
        step: "review",
        status: "success",
        frameIndex: i,
        output: reviewed,
      });

      ctx.emit({ type: "step", step: "critique", status: "running", frameIndex: i });
      try {
        critique = (
          await wrapStep(
            "critique",
            async (stepCtx) =>
              critiqueStep(
                {
                  html: final,
                  prompt: input.prompt,
                  model: input.model,
                  apiKey: input.apiKey,
                  baseURL: input.baseURL,
                  providerType: input.providerType,
                  frameIndex: i,
                },
                stepCtx,
              ),
            ctx,
          )
        ).critique;
        ctx.emit({
          type: "step",
          step: "critique",
          status: "success",
          frameIndex: i,
          output: { critique },
        });
      } catch {
        ctx.emit({ type: "step", step: "critique", status: "failed", frameIndex: i });
      }
    }

    const frame: FrameResult = {
      html: final,
      width,
      height,
      label: `Variation ${i + 1}`,
      comment,
      critique,
    };
    ctx.emit({ type: "frame", frameIndex: i, frame });
    ctx.emit({
      type: "step",
      step: "frameComplete",
      status: "success",
      frameIndex: i,
      output: frame,
    });
    return frame;
  });
}

function errorFrame(index: number): FrameResult {
  return {
    html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${index + 1} failed</p></div>`,
    label: `Variation ${index + 1}`,
  };
}
