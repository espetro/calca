import type { ProviderType } from "@app/core/ai/providers";
import { z } from "zod";

import { m } from "#/lib/i18n";

const providerTypeSchema = z.enum(["anthropic", "openai-compatible"] satisfies ProviderType[]);

const modelInfoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string(),
});

export const providerConfigSchema = z.object({
  id: z.string(),
  apiType: providerTypeSchema,
  baseUrl: z.string(),
  apiKey: z.string(),
  models: z.array(modelInfoSchema),
  lastTested: z.union([z.number(), z.null()]),
  isEnv: z.boolean().optional(),
});

export const selectedImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  name: z.string().optional(),
});

const themeSchema = z.enum(["light", "dark", "system"]);

export const settingsSchema = z.object({
  apiKey: z.string(),
  geminiKey: z.string(),
  unsplashKey: z.string(),
  openaiKey: z.string(),
  providerType: providerTypeSchema.optional(),
  baseURL: z.string(),
  model: z.string(),
  fallbackModel: z.string().optional(),
  systemPrompt: z.string(),
  systemPromptPreset: z.string(),
  conceptCount: z.number(),
  /** @deprecated Retained for persisted-settings migration — use
   * `generationMode` + `critiqueMode`. */
  quickMode: z.boolean(),
  generationMode: z.enum(["fast", "detailed"]).optional(),
  showZoomControls: z.boolean(),
  providers: z.array(providerConfigSchema),
  ideateModel: z.string().optional(),
  isIdeating: z.boolean(),
  variations: z.number(),
  /** Critique loop toggle — sequential frames with per-frame review +
   * critique feedback. Applies to both generation modes. */
  critiqueMode: z.boolean(),
  selectedImages: z.array(selectedImageSchema),
  theme: themeSchema,
  onboardingCompleted: z.boolean(),
  analyticsEnabled: z.boolean(),
});

export type SettingsInput = z.input<typeof settingsSchema>;
export type SettingsOutput = z.output<typeof settingsSchema>;

// Validation schemas with refinements (non-blocking, used for warnings)
// ---------------------------------------------------------------------------

/** Validates an API key has minimum length of 10 characters. */
export const apiKeyValidationSchema = z
  .string()
  .min(10, { error: () => m.settings_errorApiKeyTooShort() });

/** Validates model is non-empty string. */
export const modelValidationSchema = z
  .string()
  .min(1, { error: () => m.settings_errorModelRequired() });

/**
 * Validates that the selected model exists in the provider's models array.
 * Returns null on success, or an error message string on failure.
 */
export function validateModelInProvider(
  model: string,
  providerModels: { id: string }[],
): string | null {
  const slashIndex = model.indexOf("/");
  const modelId = slashIndex > 0 ? model.slice(slashIndex + 1) : model;
  const exists = providerModels.some((mod) => mod.id === modelId);
  return exists ? null : m.settings_errorModelUnavailable();
}
