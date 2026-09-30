import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildReviewPrompt } from "@app/core/prompts/review";
import { validateReview } from "@app/shared";
import type { ModelMessage } from "ai";

import { parseHtmlWithSize } from "../lib/parse-html";
import { stripBase64Images } from "../lib/strip-base64";
import type { ReviewInput, ReviewOutput, Step, StepContext } from "../types";

export const reviewStep: Step<ReviewInput, ReviewOutput> = async (input, ctx: StepContext) => {
  const { html, prompt, width, height, model, apiKey, baseURL, providerType, frameIndex } = input;
  const useModel = model;
  const frameIdx = frameIndex ?? 0;

  const { stripped, restore } = stripBase64Images(html);

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildReviewPrompt(prompt || "", width, height, stripped),
    },
  ];

  const { result } = await generateWithFallback({
    apiKey,
    model: useModel,
    messages,
    maxTokens: 16384,
    providerType: providerType as ProviderType | undefined,
    baseURL,
    functionId: `review:${frameIdx + 1}`,
    frameIndex: frameIdx,
    onFinish: (event) => ctx.tokenUsage?.add(event.usage),
  });

  const raw = result.text;

  try {
    const validated = validateReview(raw);
    return {
      html: restore(validated.html),
      width: validated.width || width,
      height: validated.height || height,
    };
  } catch (error) {
    ctx.logger.warn("Review validation failed, returning parsed output:", { error });
    const parsed = parseHtmlWithSize(raw);
    return {
      html: restore(parsed.html),
      width: parsed.width || width,
      height: parsed.height || height,
    };
  }
};
