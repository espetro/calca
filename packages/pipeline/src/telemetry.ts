import { context, Span, SpanKind, SpanStatusCode, trace, Tracer } from "@opentelemetry/api";

import type { PipelineEvent, StepContext } from "./types";

const TRACER_NAME = "calca.pipeline";

export interface TelemetryCallbacks {
  onStart(params: { modelId: string; prompt: unknown[]; settings?: Record<string, unknown> }): void;
  onFinish(params: {
    modelId: string;
    usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    finishReason: string;
    durationMs: number;
  }): void;
  onError(params: { modelId: string; error: Error }): void;
}

export interface TelemetryCallbacksOptions {
  functionId: string;
  frameIndex?: number;
  isEnabled?: boolean;
}

export function createTelemetryCallbacks(
  _category: string[] = ["calca", "pipeline", "telemetry"],
  _options: TelemetryCallbacksOptions,
): TelemetryCallbacks {
  return {
    onStart() {},
    onFinish() {},
    onError() {},
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export class TokenAggregator {
  private usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  add(u: Partial<TokenUsage>) {
    if (u.inputTokens != null) this.usage.inputTokens += u.inputTokens;
    if (u.outputTokens != null) this.usage.outputTokens += u.outputTokens;
    if (u.totalTokens != null) this.usage.totalTokens += u.totalTokens;
  }

  get(): TokenUsage {
    return { ...this.usage };
  }

  reset() {
    this.usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
}

export const tokenAggregator = new TokenAggregator();

export function getPipelineTracer(): Tracer {
  return trace.getTracer(TRACER_NAME);
}

export function wrapStep<I, O>(
  name: string,
  fn: (ctx: StepContext) => Promise<O>,
  ctx: StepContext,
): Promise<O> {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(
    `pipeline.${name}`,
    { kind: SpanKind.INTERNAL },
    async (span: Span) => {
      try {
        const result = await fn(ctx);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err instanceof Error ? err : new Error(String(err)));
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

export function createFrameSpan(frameIndex: number, conceptName: string): Span {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan("pipeline.frame", {
    kind: SpanKind.INTERNAL,
    attributes: {
      "frame.index": frameIndex,
      "frame.concept": conceptName,
    },
  });
  return span;
}

export function withActiveFrameSpan<T>(
  frameIndex: number,
  conceptName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const span = createFrameSpan(frameIndex, conceptName);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      return await fn();
    } catch (err) {
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}
