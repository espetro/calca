import { generateText, streamText, type ModelMessage } from 'ai';
import { getClaudeModel, getAIProvider, MODEL_FALLBACK_CHAIN } from './providers';
import type { ProviderType } from './providers';
import { createHash } from 'crypto';

const DEFAULT_MODEL = 'claude-opus-4-6';

// In-memory cache for prompt caching (layout stage only)
interface CacheEntry {
  cached: boolean;
  timestamp: number;
}

const promptCache = new Map<string, CacheEntry>();

// Generate cache key from system prompt + model + user prompt hash
function generateCacheKey(
  systemPrompt: string | undefined,
  model: string,
  userPrompt: string,
): string {
  const systemPart = systemPrompt || '';
  const userHash = createHash('sha256').update(userPrompt).digest('hex').substring(0, 16);
  return `${systemPart}:${model}:${userHash}`;
}

export interface GenerateOptions {
  model?: string;
  apiKey?: string;
  providerType?: ProviderType;
  baseURL?: string;
  messages: ModelMessage[];
  maxTokens: number;
  temperature?: number;
  headers?: Record<string, string | undefined>;
  enableCaching?: boolean; // Enable prompt caching (layout stage only)
  systemPrompt?: string; // System prompt for cache key generation
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

// Add Anthropic cache_control header for prompt caching
function addCacheControlHeaders(
  headers: Record<string, string>,
  enableCaching?: boolean,
): Record<string, string> {
  if (enableCaching) {
    headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
  }
  return headers;
}

// Add cache_control blocks to messages for Anthropic prompt caching
function addCacheControlToMessages(
  messages: ModelMessage[],
  enableCaching?: boolean,
): ModelMessage[] {
  if (!enableCaching) {
    return messages;
  }

  return messages.map(msg => ({
    ...msg,
    // Add cache_control to system messages for persistent caching
    content: msg.role === 'system'
      ? Array.isArray(msg.content)
        ? (msg.content as ReadonlyArray<Record<string, unknown>>).map(c => ({
            ...c,
            cache_control: { type: 'ephemeral' as const },
          }))
        : {
            ...((msg.content as unknown) as Record<string, unknown>),
            cache_control: { type: 'ephemeral' as const },
          }
      : msg.content,
  })) as ModelMessage[];
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

export async function generateWithFallback(options: GenerateOptions): Promise<{ result: Awaited<ReturnType<typeof generateText>>; usedModel: string }> {
  const providerType = options.providerType ?? (options.baseURL ? 'openai-compatible' : 'anthropic');
  const preferredModel = options.model || DEFAULT_MODEL;
  const idx = MODEL_FALLBACK_CHAIN.indexOf(preferredModel);
  const fallbacks = idx >= 0 ? MODEL_FALLBACK_CHAIN.slice(idx) : [preferredModel, ...MODEL_FALLBACK_CHAIN];

  // Check cache if enabled (layout stage only)
  if (options.enableCaching && options.systemPrompt !== undefined) {
    const userContent = messagesToText(options.messages);
    const cacheKey = generateCacheKey(options.systemPrompt, preferredModel, userContent);
    const cached = promptCache.get(cacheKey);

    if (cached) {
      console.warn('[Cache] HIT for key:', cacheKey.substring(0, 24) + '...');
    } else {
      console.warn('[Cache] MISS for key:', cacheKey.substring(0, 24) + '...');
      promptCache.set(cacheKey, { cached: true, timestamp: Date.now() });
    }
  }

  const headers = buildHeaders(options.apiKey, options.headers);
  const cacheHeaders = addCacheControlHeaders(headers, options.enableCaching);
  const cachedMessages = addCacheControlToMessages(options.messages, options.enableCaching);
  let lastError: unknown;

  for (const modelId of fallbacks) {
    try {
      const model = getModel(modelId, providerType, options.apiKey, options.baseURL);
      const result = await generateText({
        model,
        messages: cachedMessages,
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        ...(providerType === 'anthropic' ? { headers: cacheHeaders } : {}),
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

// Helper: extract text from messages for cache key
function messagesToText(messages: ModelMessage[]): string {
  return messages
    .map(msg => {
      if (msg.role === 'system') return `system:${JSON.stringify(msg.content)}`;
      if (msg.role === 'user') return `user:${JSON.stringify(msg.content)}`;
      if (msg.role === 'assistant') return `assistant:${JSON.stringify(msg.content)}`;
      return '';
    })
    .join('|');
}

export function streamAnthropic(options: GenerateOptions): ReturnType<typeof streamText> {
  const providerType = options.providerType ?? (options.baseURL ? 'openai-compatible' : 'anthropic');
  const modelId = options.model || DEFAULT_MODEL;
  const model = getModel(modelId, providerType, options.apiKey, options.baseURL);

  // Check cache if enabled (layout stage only)
  if (options.enableCaching && options.systemPrompt !== undefined) {
    const userContent = messagesToText(options.messages);
    const cacheKey = generateCacheKey(options.systemPrompt, modelId, userContent);
    const cached = promptCache.get(cacheKey);

    if (cached) {
      console.warn('[Cache] HIT for key:', cacheKey.substring(0, 24) + '...');
    } else {
      console.warn('[Cache] MISS for key:', cacheKey.substring(0, 24) + '...');
      promptCache.set(cacheKey, { cached: true, timestamp: Date.now() });
    }
  }

  const headers = buildHeaders(options.apiKey, options.headers);
  const cacheHeaders = addCacheControlHeaders(headers, options.enableCaching);
  const cachedMessages = addCacheControlToMessages(options.messages, options.enableCaching);

  return streamText({
    model,
    messages: cachedMessages,
    maxOutputTokens: options.maxTokens,
    temperature: options.temperature,
    ...(providerType === 'anthropic' ? { headers: cacheHeaders } : {}),
  });
}
