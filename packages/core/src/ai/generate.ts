import type { ModelMessage } from 'ai';
import { generateWithFallback } from './client';

export async function generateDesign(params: {
  prompt: string;
  apiKey?: string;
  model?: string;
  maxTokens: number;
  temperature?: number;
}): Promise<{ text: string; usedModel?: string }> {
  const messages: ModelMessage[] = [{ role: 'user', content: params.prompt }];
  const { result, usedModel } = await generateWithFallback({
    apiKey: params.apiKey,
    model: params.model,
    messages,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
  });
  return { text: result.text, usedModel };
}
