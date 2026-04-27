import { getLogger } from "@app/logger";
import type { ModelMessage } from "ai";
import type { LanguageModelUsage, FinishReason } from "ai";

export interface TelemetryCallbacks {
  onStart(params: { modelId: string; prompt: ModelMessage[]; settings?: Record<string, unknown> }): void;
  onFinish(params: { modelId: string; usage: LanguageModelUsage; finishReason: FinishReason; durationMs: number }): void;
  onError(params: { modelId: string; error: Error }): void;
}

export interface TelemetryCallbacksOptions {
  functionId: string;
  frameIndex?: number;
  isEnabled?: boolean;
}

export function createTelemetryCallbacks(
  category: string[] = ["calca", "core", "ai", "telemetry"],
  options: TelemetryCallbacksOptions,
): TelemetryCallbacks {
  const logger = getLogger(category);
  const functionId = options.functionId;
  const frameIndex = options.frameIndex;
  const isEnabled = options.isEnabled ?? true;

  const startTimes = new Map<string, number>();

  return {
    onStart({ modelId, prompt, settings }) {
      if (!isEnabled) return;
      const key = functionId;
      startTimes.set(key, Date.now());
      logger.debug("AI call started", {
        functionId,
        frameIndex,
        modelId,
        promptLength: prompt.length,
        settings,
      });
    },

    onFinish({ modelId, usage, finishReason, durationMs }) {
      if (!isEnabled) return;
      const key = functionId;
      startTimes.delete(key);
      logger.info("AI call completed", {
        functionId,
        frameIndex,
        modelId,
        usage,
        finishReason,
        durationMs,
      });
    },

    onError({ modelId, error }) {
      if (!isEnabled) return;
      const key = functionId;
      startTimes.delete(key);
      logger.error("AI call failed", {
        functionId,
        frameIndex,
        modelId,
        error: error.message,
      });
    },
  };
}
