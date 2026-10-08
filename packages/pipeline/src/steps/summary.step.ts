import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildSummaryPrompt } from "@app/core/prompts/summary";
import {
  stripReasoningBlocks,
  SummarySchema,
  validateSummary,
  type SummaryOutput as SummaryData,
} from "@app/shared";
import { type ModelMessage, Output } from "ai";

import { stripBase64Images } from "../lib/strip-base64";
import type { Step, StepContext, SummaryInput, SummaryOutput } from "../types";

/** Parse `{title, rationale}` out of loose model text — fenced JSON, a bare
 * object, or the raw body. Returns undefined when nothing validates. */
function parseSummaryText(text: string | undefined): SummaryData | undefined {
  const raw = stripReasoningBlocks(text ?? "");
  const candidates = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1]!.trim());
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(raw.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      return validateSummary(JSON.parse(candidate));
    } catch {}
  }
  return undefined;
}

export const summaryStep: Step<SummaryInput, SummaryOutput> = async (input, ctx: StepContext) => {
  const { html, prompt, labels, model, apiKey, baseURL, providerType, mode } = input;

  const { stripped } = stripBase64Images(html);

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildSummaryPrompt(prompt, stripped, labels ?? []),
    },
  ];

  // "fast" mode targets weak/free models that can't satisfy `Output.object`
  // at all — go straight to a plain text completion and parse leniently.
  if (mode === "fast") {
    try {
      const { result } = await generateWithFallback({
        apiKey,
        model: model,
        messages,
        maxTokens: 512,
        providerType: providerType as ProviderType | undefined,
        baseURL,
        functionId: "summary",
        output: Output.text(),
        onFinish: (event) => ctx.tokenUsage?.add(event.usage),
      });
      const summary = parseSummaryText(result.text);
      if (summary) return { summary };
      ctx.logger.warn("Summary validation failed:", {
        raw: stripReasoningBlocks(result.text ?? "").slice(0, 200),
      });
    } catch (error) {
      ctx.logger.warn("Summary text fallback failed:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { summary: undefined };
  }

  const { result } = await generateWithFallback({
    apiKey,
    model: model,
    messages,
    maxTokens: 512,
    providerType: providerType as ProviderType | undefined,
    baseURL,
    functionId: "summary",
    output: Output.object({ schema: SummarySchema }),
    onFinish: (event) => ctx.tokenUsage?.add(event.usage),
  });

  try {
    return { summary: validateSummary(result.output) };
  } catch {
    // Provider ignored the structured-output spec — parse the raw text below.
  }

  const fromObjectCall = parseSummaryText(result.text);
  if (fromObjectCall) {
    return { summary: fromObjectCall };
  }

  // Weak/free models often can't satisfy `Output.object` at all — the call
  // returns empty text. Retry as a plain text completion; the prompt already
  // instructs `{title, rationale}` JSON which we can parse leniently.
  try {
    const { result: textResult } = await generateWithFallback({
      apiKey,
      model: model,
      messages,
      maxTokens: 512,
      providerType: providerType as ProviderType | undefined,
      baseURL,
      functionId: "summary:text",
      output: Output.text(),
      onFinish: (event) => ctx.tokenUsage?.add(event.usage),
    });
    const fromTextCall = parseSummaryText(textResult.text);
    if (fromTextCall) {
      return { summary: fromTextCall };
    }
    ctx.logger.warn("Summary validation failed:", {
      raw: stripReasoningBlocks(textResult.text ?? "").slice(0, 200),
    });
  } catch (error) {
    ctx.logger.warn("Summary text fallback failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { summary: undefined };
};
