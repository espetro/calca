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
  id: "summary",
  inputSchema: SummaryInputSchema,
  outputSchema: SummaryOutputSchema,
  execute: async ({ inputData }) => {
    const { html, prompt, labels, model, apiKey, baseURL, providerType } = inputData;
    
    const { stripped } = stripBase64Images(html);
    
    const messages: ModelMessage[] = [{
      role: "user",
      content: buildSummaryPrompt(prompt, stripped, labels ?? []),
    }];
    
    const { result } = await generateWithFallback({
      apiKey,
      model: model ?? DEFAULT_MODEL,
      messages,
      maxTokens: 512,
      providerType: providerType as ProviderType | undefined,
      baseURL,
      functionId: "summary",
    });
    
    const raw = result.text;
    try {
      const parsed = JSON.parse(raw);
      const validated = validateSummary(parsed);
      return { summary: JSON.stringify(validated) };
    } catch (validationErr) {
      logger.warn("Summary validation failed:", validationErr);
      return { summary: raw };
    }
  },
});
