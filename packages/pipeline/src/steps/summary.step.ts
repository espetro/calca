import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildSummaryPrompt } from "@app/core/prompts/summary";
import { stripReasoningBlocks, SummarySchema, validateSummary } from "@app/shared";
import { type ModelMessage, Output } from "ai";

import { stripBase64Images } from "../lib/strip-base64";
import type { Step, StepContext, SummaryInput, SummaryOutput } from "../types";

export const summaryStep: Step<SummaryInput, SummaryOutput> = async (input, ctx: StepContext) => {
  const { html, prompt, labels, model, apiKey, baseURL, providerType } = input;

  const { stripped } = stripBase64Images(html);

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildSummaryPrompt(prompt, stripped, labels ?? []),
    },
  ];

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

  const raw = stripReasoningBlocks(result.text ?? "");
  const candidates = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1].trim());
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(raw.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      const validated = validateSummary(JSON.parse(candidate));
      return { summary: validated };
    } catch {}
  }
  ctx.logger.warn("Summary validation failed:", { raw: raw.slice(0, 200) });
  return { summary: undefined };
};
