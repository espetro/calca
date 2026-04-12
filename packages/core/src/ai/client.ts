import { generateText, streamText, type ModelMessage } from 'ai';
import { getClaudeModel, getAIProvider, MODEL_FALLBACK_CHAIN } from './providers';
import type { ProviderType } from './providers';

const DEFAULT_MODEL = 'claude-opus-4-6';

export interface GenerateOptions {
  model?: string;
  apiKey?: string;
  providerType?: ProviderType;
  baseURL?: string;
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

function getModel(
  modelId: string,
  providerType: ProviderType,
  apiKey?: string,
  baseURL?: string,
) {
  if (providerType === 'anthropic') {
    return getClaudeModel(modelId);
  }
  const provider = getAIProvider(providerType, apiKey, baseURL);
  return provider(modelId);
}

export async function generateWithFallback(options: GenerateOptions) {
  const providerType = options.providerType ?? 'anthropic';
  const preferredModel = options.model || DEFAULT_MODEL;
  const idx = MODEL_FALLBACK_CHAIN.indexOf(preferredModel);
  const fallbacks = idx >= 0 ? MODEL_FALLBACK_CHAIN.slice(idx) : [preferredModel, ...MODEL_FALLBACK_CHAIN];

  const headers = buildHeaders(options.apiKey, options.headers);
  let lastError: unknown;

  for (const modelId of fallbacks) {
    try {
      const model = getModel(modelId, providerType, options.apiKey, options.baseURL);
      const result = await generateText({
        model,
        messages: options.messages,
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        ...(providerType === 'anthropic' ? { headers } : {}),
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
  const providerType = options.providerType ?? 'anthropic';
  const modelId = options.model || DEFAULT_MODEL;
  const model = getModel(modelId, providerType, options.apiKey, options.baseURL);
  const headers = buildHeaders(options.apiKey, options.headers);
  return streamText({
    model,
    messages: options.messages,
    maxOutputTokens: options.maxTokens,
    temperature: options.temperature,
    ...(providerType === 'anthropic' ? { headers } : {}),
  });
}
