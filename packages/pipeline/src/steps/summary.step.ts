import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildSummaryPrompt } from "@app/core/prompts/summary";
import { validateSummary } from "@app/shared";
import type { ModelMessage } from "ai";

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
    onFinish: (event) => ctx.tokenUsage?.add(event.usage),
  });

  const raw = result.text;
  try {
    const parsed = JSON.parse(raw);
    const validated = validateSummary(parsed);
    return { summary: JSON.stringify(validated) };
  } catch (error) {
    ctx.logger.warn("Summary validation failed:", { error });
    return { summary: raw };
  }
};
