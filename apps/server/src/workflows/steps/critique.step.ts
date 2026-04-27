import { createStep } from "@mastra/core/workflows";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildCritiquePrompt } from "@app/core/prompts/critique";
import { CritiqueInputSchema, CritiqueOutputSchema } from "../schemas/critique.schema";
import { stripBase64Images } from "../../lib/strip-base64";

export const critiqueStep = createStep({
  execute: async ({ inputData }) => {
    const { html, prompt, model, apiKey, baseURL, providerType } = inputData;

    // Strip base64 images to reduce token usage
    const { stripped } = stripBase64Images(html);

    const messages: ModelMessage[] = [
      {
        content: buildCritiquePrompt(prompt || "", stripped),
        role: "user",
      },
    ];

    const { result } = await generateWithFallback({
      apiKey,
      baseURL,
      maxTokens: 1024,
      messages,
      model: model || "claude-opus-4-6",
      providerType: providerType as ProviderType | undefined,
    });

    return {
      critique: result.text,
    };
  },
  id: "critique",
  inputSchema: CritiqueInputSchema,
  outputSchema: CritiqueOutputSchema,
});
