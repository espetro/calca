import { getLogger } from "@app/logger";

import { designPipeline } from "./pipeline";
import type { FrameResult, PipelineEvent } from "./types";
import { WorkflowInputSchema } from "./types";

interface WorkflowStepResult {
  name: string;
  status: string;
  input: null;
  output: unknown;
  suspendPayload: null;
  resumePayload: null;
}

interface WorkflowData {
  name: string;
  status: string;
  steps: Record<string, WorkflowStepResult>;
  output: {
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  } | null;
}

const STEP_ORDER = ["plan", "frameOrchestrator", "summary", "collectResults"];

function buildInitialSteps(): Record<string, WorkflowStepResult> {
  return {
    plan: {
      name: "plan",
      status: "running",
      input: null,
      output: null,
      suspendPayload: null,
      resumePayload: null,
    },
  };
}

function buildWorkflowData(steps: Record<string, WorkflowStepResult>): WorkflowData {
  const orderedSteps: Record<string, WorkflowStepResult> = {};
  for (const name of STEP_ORDER) {
    if (steps[name]) {
      orderedSteps[name] = steps[name]!;
    }
  }
  for (const [name, result] of Object.entries(steps)) {
    if (!orderedSteps[name]) {
      orderedSteps[name] = result;
    }
  }

  const isFailed = Object.values(steps).some((s) => s.status === "failed");
  const isSuccess = steps.collectResults?.status === "success" || steps.plan?.status === "success";

  return {
    name: "designPipeline",
    status: isFailed ? "failed" : isSuccess ? "success" : "running",
    steps: orderedSteps,
    output: {
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    },
  };
}

function updateSteps(
  steps: Record<string, WorkflowStepResult>,
  event: PipelineEvent,
): Record<string, WorkflowStepResult> {
  switch (event.type) {
    case "step": {
      const existing = steps[event.step];
      steps[event.step] = {
        name: event.step,
        status: event.status,
        input: existing?.input ?? null,
        output: event.output ?? existing?.output ?? null,
        suspendPayload: null,
        resumePayload: null,
      };
      break;
    }
    case "frame": {
      const fo = steps.frameOrchestrator;
      if (fo) {
        const frames = ((fo.output as { frames?: FrameResult[] } | null)?.frames ??
          []) as FrameResult[];
        frames[event.frameIndex] = event.frame;
        fo.output = { frames };
      }
      break;
    }
    case "done": {
      steps.collectResults = {
        name: "collectResults",
        status: "success",
        input: null,
        output: event.output,
        suspendPayload: null,
        resumePayload: null,
      };
      break;
    }
    case "error": {
      break;
    }
    case "abort": {
      break;
    }
  }
  return steps;
}

function encodeSSE(index: number, part: { type: string; [key: string]: unknown }): Uint8Array {
  const line = `${index}:${JSON.stringify(part)}\n`;
  return new TextEncoder().encode(line);
}

export function designPipelineStream(input: unknown): ReadableStream<Uint8Array> {
  const parsed = WorkflowInputSchema.safeParse(input);
  if (!parsed.success) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encodeSSE(0, { type: "error", errorText: "Invalid workflow input" }));
        controller.close();
      },
    });
  }

  const abortController = new AbortController();

  return new ReadableStream({
    async start(controller) {
      const steps = buildInitialSteps();
      let index = 0;

      const send = (part: { type: string; [key: string]: unknown }) => {
        controller.enqueue(encodeSSE(index++, part));
      };

      const emit = (event: PipelineEvent) => {
        updateSteps(steps, event);
        send({ type: "data-workflow", id: "designPipeline", data: buildWorkflowData(steps) });
      };

      send({ type: "data-workflow", id: "designPipeline", data: buildWorkflowData(steps) });

      try {
        await designPipeline(parsed.data, {
          signal: abortController.signal,
          emit,
          logger: getLogger(["calca", "pipeline", "stream"]),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type: "error", errorText: message });
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });
}
