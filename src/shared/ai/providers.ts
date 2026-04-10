import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export const claudeModels = {
  'claude-opus-4-6': anthropic('claude-opus-4-6'),
  'claude-opus-4-5-20250918': anthropic('claude-opus-4-5-20250918'),
  'claude-sonnet-4-5': anthropic('claude-sonnet-4-5'),
  'claude-opus-4': anthropic('claude-opus-4'),
  'claude-sonnet-4': anthropic('claude-sonnet-4'),
  'claude-sonnet-4-20250514': anthropic('claude-sonnet-4-20250514'),
} as const;

export const geminiModels = {
  'gemini-2.0-flash': google('gemini-2.0-flash'),
} as const;

export type ClaudeModelId = keyof typeof claudeModels;
export type GeminiModelId = keyof typeof geminiModels;

export function getClaudeModel(modelId: string) {
  const m = claudeModels[modelId as ClaudeModelId];
  if (m) return m;
  if (modelId === 'claude-sonnet-4-5-20250514') {
    return claudeModels['claude-sonnet-4-5'] ?? claudeModels['claude-sonnet-4-20250514'];
  }
  return claudeModels['claude-opus-4-6'];
}

export function getGeminiModel(modelId: string) {
  return geminiModels[modelId as GeminiModelId] ?? geminiModels['gemini-2.0-flash'];
}

export const MODEL_FALLBACK_CHAIN: string[] = [
  'claude-opus-4-6',
  'claude-sonnet-4-5',
  'claude-opus-4',
  'claude-sonnet-4',
];
