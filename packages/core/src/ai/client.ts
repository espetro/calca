import { generateText, streamText, type ModelMessage } from 'ai';
import type { LanguageModelUsage, FinishReason } from 'ai';
import { getClaudeModel, getAIProvider } from './providers';
import type { ProviderType } from './providers';
import { createHash } from 'crypto';
import { createTelemetryCallbacks } from './telemetry';
import { getLogger } from '@app/logger';

const CACHE_MAX_ENTRIES = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Local fallback chain (MODEL_FALLBACK_CHAIN removed in Task 6)
const FALLBACK_CHAIN: string[] = [
  'claude-opus-4-6',
  'claude-sonnet-4-5',
  'claude-opus-4',
  'claude-sonnet-4',
];

// In-memory cache for AI responses
interface CacheEntry {
  result: { text: string; usage: LanguageModelUsage; finishReason: FinishReason };
  timestamp: number;
}

const promptCache = new Map<string, CacheEntry>();

// LRU eviction: remove oldest entry when cache is full
function evictIfNeeded(): void {
  if (promptCache.size >= CACHE_MAX_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of promptCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      promptCache.delete(oldestKey);
    }
  }
}

// Check if cache entry is expired
function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL_MS;
}

// Generate cache key from system prompt + provider type + model + user messages hash
function generateCacheKey(
  systemPrompt: string | undefined,
  providerType: ProviderType,
  model: string,
  userMessages: string,
): string {
  const systemHash = createHash('sha256').update(systemPrompt || '').digest('hex').substring(0, 16);
  const messagesHash = createHash('sha256').update(userMessages).digest('hex').substring(0, 16);
  return `${systemHash}:${providerType}:${model}:${messagesHash}`;
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
  enableCaching?: boolean;
  systemPrompt?: string;
  functionId?: string;
  frameIndex?: number;
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

function wrapTelemetry<T>(fn: () => T): T {
  try {
    return fn();
  } catch {
    return fn(); // Already threw, re-throw
  }
}

export async function generateWithFallback(options: GenerateOptions): Promise<{ result: Awaited<ReturnType<typeof generateText>>; usedModel: string }> {
  if (!options.model) {
    throw new Error("No model specified. Configure a model in Settings.");
  }

  const providerType = options.providerType ?? (options.baseURL ? 'openai-compatible' : 'anthropic');
  const preferredModel = options.model;
  const idx = FALLBACK_CHAIN.indexOf(preferredModel);
  const fallbacks = idx >= 0 ? FALLBACK_CHAIN.slice(idx) : [preferredModel, ...FALLBACK_CHAIN];

  const cacheLogger = getLogger(['calca', 'core', 'ai', 'cache']);

  // Check cache if enabled
  if (options.enableCaching && options.systemPrompt !== undefined) {
    const userContent = messagesToText(options.messages);
    const cacheKey = generateCacheKey(options.systemPrompt, providerType, preferredModel, userContent);
    const cached = promptCache.get(cacheKey);

    if (cached && !isExpired(cached)) {
      cacheLogger.info(`[Cache] HIT for key: ${cacheKey.substring(0, 24)}...`);
      return {
        result: {
          text: cached.result.text,
          usage: cached.result.usage,
          finishReason: cached.result.finishReason,
        } as Awaited<ReturnType<typeof generateText>>,
        usedModel: preferredModel,
      };
    } else {
      if (cached) {
        // Expired - remove it
        promptCache.delete(cacheKey);
      }
      cacheLogger.info(`[Cache] MISS for key: ${cacheKey.substring(0, 24)}...`);
    }
  }

  const headers = buildHeaders(options.apiKey, options.headers);
  const cacheHeaders = addCacheControlHeaders(headers, options.enableCaching);
  const cachedMessages = addCacheControlToMessages(options.messages, options.enableCaching);
  let lastError: unknown;

  const telemetry = createTelemetryCallbacks(["calca", "core", "ai", "generateWithFallback"], { functionId: options.functionId ?? "generateWithFallback", frameIndex: options.frameIndex });

  for (let i = 0; i < fallbacks.length; i++) {
    const modelId = fallbacks[i];

    // Add backoff delay between fallback attempts (not before first attempt)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    cacheLogger.info(`Trying model: ${modelId} (fallback attempt ${i + 1}/${fallbacks.length})`);

    try {
      const model = getModel(modelId, providerType, options.apiKey, options.baseURL);
      const result = await generateText({
        model,
        messages: cachedMessages,
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        ...(providerType === 'anthropic' ? { headers: cacheHeaders } : {}),
        experimental_onStart: ({ model: m }) => {
          try {
            telemetry.onStart({ modelId: m.modelId, prompt: cachedMessages });
          } catch { /* ignore telemetry errors */ }
        },
        onStepFinish: (event) => {
          try {
            telemetry.onFinish({ modelId, usage: event.usage, finishReason: event.finishReason, durationMs: Date.now() });
          } catch { /* ignore telemetry errors */ }
        },
        onFinish: (event) => {
          try {
            telemetry.onFinish({ modelId, usage: event.totalUsage, finishReason: event.finishReason ?? "unknown", durationMs: Date.now() });
          } catch { /* ignore telemetry errors */ }
        },
      });

      // Store in cache on successful response
      if (options.enableCaching && options.systemPrompt !== undefined) {
        evictIfNeeded();
        const userContent = messagesToText(options.messages);
        const cacheKey = generateCacheKey(options.systemPrompt, providerType, preferredModel, userContent);
        promptCache.set(cacheKey, {
          result: {
            text: result.text,
            usage: result.usage,
            finishReason: result.finishReason ?? "unknown",
          },
          timestamp: Date.now(),
        });
      }

      return { result, usedModel: modelId };
    } catch (err: unknown) {
      if (isModelNotFoundError(err)) {
        lastError = err;
        try {
          telemetry.onError({ modelId, error: err instanceof Error ? err : new Error(String(err)) });
        } catch { /* ignore telemetry errors */ }
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
  if (!options.model) {
    throw new Error("No model specified. Configure a model in Settings.");
  }

  const providerType = options.providerType ?? (options.baseURL ? 'openai-compatible' : 'anthropic');
  const modelId = options.model;
  const model = getModel(modelId, providerType, options.apiKey, options.baseURL);

  const cacheLogger = getLogger(['calca', 'core', 'ai', 'cache']);

  // Check cache if enabled
  if (options.enableCaching && options.systemPrompt !== undefined) {
    const userContent = messagesToText(options.messages);
    const cacheKey = generateCacheKey(options.systemPrompt, providerType, modelId, userContent);
    const cached = promptCache.get(cacheKey);

    if (cached && !isExpired(cached)) {
      cacheLogger.info(`[Cache] HIT for key: ${cacheKey.substring(0, 24)}...`);
      // For streaming, we can't return cached response directly
      // Log and continue to stream (streaming responses are not cached)
    } else {
      if (cached) {
        promptCache.delete(cacheKey);
      }
      cacheLogger.info(`[Cache] MISS for key: ${cacheKey.substring(0, 24)}... (streaming)`);
    }
  }

  const headers = buildHeaders(options.apiKey, options.headers);
  const cacheHeaders = addCacheControlHeaders(headers, options.enableCaching);
  const cachedMessages = addCacheControlToMessages(options.messages, options.enableCaching);

  const telemetry = createTelemetryCallbacks(["calca", "core", "ai", "streamAnthropic"], { functionId: options.functionId ?? "streamAnthropic", frameIndex: options.frameIndex });

  return streamText({
    model,
    messages: cachedMessages,
    maxOutputTokens: options.maxTokens,
    temperature: options.temperature,
    ...(providerType === 'anthropic' ? { headers: cacheHeaders } : {}),
    experimental_onStart: ({ model: m }) => {
      try {
        telemetry.onStart({ modelId: m.modelId, prompt: cachedMessages });
      } catch { /* ignore telemetry errors */ }
    },
    onStepFinish: (event) => {
      try {
        telemetry.onFinish({ modelId, usage: event.usage, finishReason: event.finishReason, durationMs: Date.now() });
      } catch { /* ignore telemetry errors */ }
    },
    onFinish: (event) => {
      try {
        telemetry.onFinish({ modelId, usage: event.totalUsage, finishReason: event.finishReason ?? "unknown", durationMs: Date.now() });
      } catch { /* ignore telemetry errors */ }
    },
  });
}