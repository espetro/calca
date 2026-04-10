import { generateText, streamText, type ModelMessage } from 'ai';
import { getClaudeModel, MODEL_FALLBACK_CHAIN } from './providers';

const DEFAULT_MODEL = 'claude-opus-4-6';

export interface GenerateOptions {
  model?: string;
  apiKey?: string;
  messages: ModelMessage[];
  maxTokens: number;
  temperature?: number;
  headers?: Record<string, string | undefined>;
}

function buildHeaders(apiKey?: string, extraHeaders?: Record<string, string | undefined>): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-anthropic-key'] = apiKey;
  }
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (v) headers[k] = v;
    }
  }
  return headers;
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('not_found') || msg.includes('404') || msg.includes('Could not resolve') || msg.includes('does not exist') || msg.includes('model');
}

export async function generateWithFallback(options: GenerateOptions) {
  const preferredModel = options.model || DEFAULT_MODEL;
  const idx = MODEL_FALLBACK_CHAIN.indexOf(preferredModel);
  const fallbacks = idx >= 0 ? MODEL_FALLBACK_CHAIN.slice(idx) : [preferredModel, ...MODEL_FALLBACK_CHAIN];

  const headers = buildHeaders(options.apiKey, options.headers);
  let lastError: unknown;

  for (const modelId of fallbacks) {
    try {
      const model = getClaudeModel(modelId);
      const result = await generateText({
        model,
        messages: options.messages,
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        headers,
      });
      return { result, usedModel: modelId };
    } catch (err: unknown) {
      if (isModelNotFoundError(err)) {
        console.warn(`Model ${modelId} unavailable, trying fallback...`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export function streamAnthropic(options: GenerateOptions) {
  const modelId = options.model || DEFAULT_MODEL;
  const model = getClaudeModel(modelId);
  const headers = buildHeaders(options.apiKey, options.headers);
  return streamText({
    model,
    messages: options.messages,
    maxOutputTokens: options.maxTokens,
    temperature: options.temperature,
    headers,
  });
}
