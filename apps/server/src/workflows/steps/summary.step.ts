import { createStep } from "@mastra/core/workflows";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildSummaryPrompt } from "@app/core/prompts/summary";
import { validateSummary } from "@app/shared";
import { stripBase64Images } from "../../lib/strip-base64";
import { SummaryInputSchema, SummaryOutputSchema } from "../schemas/summary.schema";
import { getLogger } from "@app/logger";

const logger = getLogger(["calca", "server", "workflow", "summary"]);

const DEFAULT_MODEL = "claude-opus-4-6";

export const summaryStep = createStep({
  execute: async ({ inputData }) => {
    const { html, prompt, labels, model, apiKey, baseURL, providerType } = inputData;

    const { stripped } = stripBase64Images(html);

    const messages: ModelMessage[] = [
      {
        content: buildSummaryPrompt(prompt, stripped, labels ?? []),
        role: "user",
      },
    ];

    const { result } = await generateWithFallback({
      apiKey,
      baseURL,
      maxTokens: 512,
      messages,
      model: model ?? DEFAULT_MODEL,
      providerType: providerType as ProviderType | undefined,
    });

    const raw = result.text;
    try {
      const parsed = JSON.parse(raw);
      const validated = validateSummary(parsed);
      return { summary: JSON.stringify(validated) };
    } catch (error) {
      logger.warn("Summary validation failed:", { error });
      return { summary: raw };
    }
  },
  id: "summary",
  inputSchema: SummaryInputSchema,
  outputSchema: SummaryOutputSchema,
});
