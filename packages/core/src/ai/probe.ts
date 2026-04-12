import { generateText } from 'ai';
import { getClaudeModel } from './providers';
import type { ProviderType } from './providers';

const MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-5',
  'claude-opus-4',
  'claude-sonnet-4',
];

function isNotFoundError(msg: string): boolean {
  return (
    msg.includes('not_found') ||
    msg.includes('404') ||
    msg.includes('Could not resolve') ||
    msg.includes('does not exist')
  );
}

export interface ModelInfo {
  id: string;
  available: boolean;
}

export async function probeModels(
  apiKey: string,
  baseURL?: string,
  providerType?: ProviderType,
): Promise<Record<string, boolean>> {
  // For OpenAI-compatible providers, fetch models from the /models endpoint
  if (providerType === 'openai-compatible') {
    return probeOpenAICompatibleModels(apiKey, baseURL);
  }

  // Default: Anthropic-style probing (also used when providerType is undefined for backward compat)
  return probeAnthropicModels(apiKey);
}

async function probeAnthropicModels(apiKey: string): Promise<Record<string, boolean>> {
  const headers: Record<string, string> = { 'x-anthropic-key': apiKey };
  const available: Record<string, boolean> = {};

  for (const model of MODELS) {
    try {
      await generateText({
        model: getClaudeModel(model),
        maxOutputTokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
        headers,
      });
      available[model] = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Probe ${model}:`, msg);

      // Only mark unavailable for definitive "not found" errors
      if (isNotFoundError(msg)) {
        available[model] = false;
      } else {
        // Rate limit, overloaded, timeout, or any other error — assume available
        available[model] = true;
      }
    }
  }

  return available;
}

async function probeOpenAICompatibleModels(
  apiKey: string,
  baseURL?: string,
): Promise<Record<string, boolean>> {
  const baseUrl = baseURL?.replace(/\/+$/, '') ?? '';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('OpenAI-compatible /models endpoint returned 404');
        return {};
      }
      console.log(`OpenAI-compatible /models returned status ${response.status}`);
      return {};
    }

    const data = (await response.json()) as { data?: Array<{ id: string }> };
    const models = data.data ?? [];
    const available: Record<string, boolean> = {};

    for (const model of models) {
      available[model.id] = true;
    }

    return available;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('OpenAI-compatible probe error:', msg);
    return {};
  }
}
