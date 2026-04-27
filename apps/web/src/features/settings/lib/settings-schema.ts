import { z } from "zod";
import type { ProviderType } from "@app/core/ai/providers";

const providerTypeSchema = z.enum(["anthropic", "openai-compatible"] satisfies ProviderType[]);

const modelInfoSchema = z.object({
  description: z.string(),
  displayName: z.string(),
  id: z.string(),
});

export const providerConfigSchema = z.object({
  apiKey: z.string(),
  apiType: providerTypeSchema,
  baseUrl: z.string(),
  id: z.string(),
  isEnv: z.boolean().optional(),
  lastTested: z.union([z.number(), z.null()]),
  models: z.array(modelInfoSchema),
});

export const selectedImageSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  src: z.string(),
});

const themeSchema = z.enum(["light", "dark", "system"]);

export const settingsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string(),
  conceptCount: z.number(),
  critiqueMode: z.boolean(),
  geminiKey: z.string(),
  ideateModel: z.string().optional(),
  isIdeating: z.boolean(),
  model: z.string(),
  onboardingCompleted: z.boolean(),
  openaiKey: z.string(),
  providerType: providerTypeSchema.optional(),
  providers: z.array(providerConfigSchema),
  quickMode: z.boolean(),
  selectedImages: z.array(selectedImageSchema),
  showZoomControls: z.boolean(),
  systemPrompt: z.string(),
  systemPromptPreset: z.string(),
  theme: themeSchema,
  unsplashKey: z.string(),
  variations: z.number(),
});

export type SettingsInput = z.input<typeof settingsSchema>;
export type SettingsOutput = z.output<typeof settingsSchema>;

// Validation schemas with refinements (non-blocking, used for warnings)
// ---------------------------------------------------------------------------

/** Validates an API key has minimum length of 10 characters. */
export const apiKeyValidationSchema = z.string().min(10, "API key must be at least 10 characters");

/** Validates model is non-empty string. */
export const modelValidationSchema = z.string().min(1, "Model is required");

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
  const exists = providerModels.some((m) => m.id === modelId);
  return exists ? null : "Selected model is not available for this provider";
}
