import { createStep } from "@mastra/core/workflows";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildCritiquePrompt } from "@app/core/prompts/critique";
import { CritiqueInputSchema, CritiqueOutputSchema } from "../schemas/critique.schema";
import { stripBase64Images } from "../../lib/strip-base64";

export const critiqueStep = createStep({
  id: "critique",
  inputSchema: CritiqueInputSchema,
  outputSchema: CritiqueOutputSchema,
  execute: async ({ inputData }) => {
    const { html, prompt, model, apiKey, baseURL, providerType, frameIndex } = inputData;
    const frameIdx = frameIndex ?? 0;

    // Strip base64 images to reduce token usage
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
    });

    return {
      critique: result.text,
    };
  },
});
