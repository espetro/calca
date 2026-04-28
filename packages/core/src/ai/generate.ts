import type { ModelMessage } from "ai";

import { generateWithFallback } from "./client";

export async function generateDesign(params: {
  prompt: string;
  apiKey?: string;
  model?: string;
  maxTokens: number;
  temperature?: number;
}): Promise<{ text: string; usedModel?: string }> {
  const messages: ModelMessage[] = [{ content: params.prompt, role: "user" }];
  const { result, usedModel } = await generateWithFallback({
    apiKey: params.apiKey,
    maxTokens: params.maxTokens,
    messages,
    model: params.model,
    temperature: params.temperature,
  });
  return { text: result.text, usedModel };
}
