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
  execute: async ({ inputData }) => {
    const { html, prompt, width, height, model, apiKey, baseURL, providerType } = inputData;
    const useModel = model || DEFAULT_MODEL;

    const { stripped, restore } = stripBase64Images(html);

    const messages: ModelMessage[] = [
      {
        content: buildReviewPrompt(prompt || "", width, height, stripped),
        role: "user",
      },
    ];

    const { result } = await generateWithFallback({
      apiKey,
      baseURL,
      maxTokens: 16384,
      messages,
      model: useModel,
      providerType: providerType as ProviderType | undefined,
    });

    const raw = result.text;

    try {
      const validated = validateReview(raw);
      return {
        height: validated.height || height,
        html: restore(validated.html),
        width: validated.width || width,
      };
    } catch (error) {
      logger.warn("Review validation failed, returning parsed output:", { error });
      const parsed = parseHtmlWithSize(raw);
      return {
        height: parsed.height || height,
        html: restore(parsed.html),
        width: parsed.width || width,
      };
    }
  },
  id: "review",
  inputSchema: ReviewInputSchema,
  outputSchema: ReviewOutputSchema,
});
