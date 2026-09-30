import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildCritiquePrompt } from "@app/core/prompts/critique";
import type { ModelMessage } from "ai";

import { stripBase64Images } from "../lib/strip-base64";
import type { CritiqueInput, CritiqueOutput, Step, StepContext } from "../types";

export const critiqueStep: Step<CritiqueInput, CritiqueOutput> = async (
  input,
  ctx: StepContext,
) => {
  const { html, prompt, model, apiKey, baseURL, providerType, frameIndex } = input;
  const frameIdx = frameIndex ?? 0;

  const { stripped } = stripBase64Images(html);

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildCritiquePrompt(prompt || "", stripped),
    },
  ];

  const { result } = await generateWithFallback({
    apiKey,
    model: model,
    messages,
    maxTokens: 1024,
    providerType: providerType as ProviderType | undefined,
    baseURL,
    functionId: `critique:${frameIdx + 1}`,
    frameIndex: frameIdx,
    onFinish: (event) => ctx.tokenUsage?.add(event.usage),
  });

  return {
    critique: result.text,
  };
};
