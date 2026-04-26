import { createStep } from "@mastra/core/workflows";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildReviewPrompt } from "@app/core/prompts/review";
import { validateReview } from "@app/shared";
import { parseHtmlWithSize } from "../../lib/parse-html";
import { stripBase64Images } from "../../lib/strip-base64";
import { ReviewInputSchema, ReviewOutputSchema } from "../schemas/review.schema";
import { getLogger } from "@app/logger";

const DEFAULT_MODEL = "claude-opus-4-6";

const logger = getLogger(["calca", "server", "workflow", "review"]);

export const reviewStep = createStep({
  id: "review",
  inputSchema: ReviewInputSchema,
  outputSchema: ReviewOutputSchema,
  execute: async ({ inputData }) => {
    const { html, prompt, width, height, model, apiKey, baseURL, providerType } = inputData;
    const useModel = model || DEFAULT_MODEL;

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
      logger.warn("Review validation failed, returning parsed output:", { error });
      const parsed = parseHtmlWithSize(raw);
      return {
        html: restore(parsed.html),
        width: parsed.width || width,
        height: parsed.height || height,
      };
    }
  },
});
