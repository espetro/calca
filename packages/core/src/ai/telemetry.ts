import { getLogger } from "@app/logger";
import type { ModelMessage } from "ai";
import type { FinishReason, LanguageModelUsage } from "ai";

export interface TelemetryCallbacks {
  onStart(params: {
    modelId: string;
    prompt: ModelMessage[];
    settings?: Record<string, unknown>;
  }): void;
  onFinish(params: {
    modelId: string;
    usage: LanguageModelUsage;
    finishReason: FinishReason;
    durationMs: number;
  }): void;
  onError(params: { modelId: string; error: Error }): void;
}

export interface TelemetryCallbacksOptions {
  functionId?: string;
  isEnabled?: boolean;
}

export function createTelemetryCallbacks(
  category: string[] = ["calca", "core", "ai", "telemetry"],
  options?: TelemetryCallbacksOptions,
): TelemetryCallbacks {
  const logger = getLogger(category);
  const functionId = options?.functionId;
  const isEnabled = options?.isEnabled ?? true;

  const startTimes = new Map<string, number>();

  return {
    onError({ modelId, error }) {
      if (!isEnabled) {return;}
      const key = functionId ?? modelId;
      startTimes.delete(key);
      logger.error("AI call failed", {
        error: error.message,
        functionId,
        modelId,
      });
    },

    onFinish({ modelId, usage, finishReason, durationMs }) {
      if (!isEnabled) {return;}
      const key = functionId ?? modelId;
      startTimes.delete(key);
      logger.info("AI call completed", {
        durationMs,
        finishReason,
        functionId,
        modelId,
        usage,
      });
    },

    onStart({ modelId, prompt, settings }) {
      if (!isEnabled) {return;}
      const key = functionId ?? modelId;
      startTimes.set(key, Date.now());
      logger.debug("AI call started", {
        functionId,
        modelId,
        promptLength: prompt.length,
        settings,
      });
    },
  };
}
