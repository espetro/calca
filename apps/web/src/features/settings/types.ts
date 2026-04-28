import type { ProviderType } from "@app/core/ai/providers";
export type { ProviderType };

export interface ModelInfo {
  id: string;
  displayName: string;
  description: string;
}

export interface ProviderConfig {
  id: string;
  apiType: ProviderType;
  baseUrl: string;
  apiKey: string;
  models: ModelInfo[];
  lastTested: number | null;
  isEnv?: boolean;
}

export interface SelectedImage {
  id: string;
  src: string;
  name?: string;
}

export type Theme = "light" | "dark" | "system";

export interface Settings {
  apiKey: string;
  geminiKey: string;
  unsplashKey: string;
  openaiKey: string;
  providerType: ProviderType | undefined;
  baseURL: string;
  model: string;
  fallbackModel?: string;
  systemPrompt: string;
  systemPromptPreset: string;
  conceptCount: number;
  quickMode: boolean;
  showZoomControls: boolean;
  providers: ProviderConfig[];
  ideateModel?: string;
  isIdeating: boolean;
  /** @deprecated Use conceptCount instead */
  variations: number;
  /** @deprecated Use quickMode instead */
  critiqueMode: boolean;
  selectedImages: SelectedImage[];
  theme: Theme;
  onboardingCompleted: boolean;
  analyticsEnabled: boolean;
}

export const MODELS: { id: string; label: string }[] = [
  { id: "claude-sonnet-4-20250514", label: "Sonnet 4.5" },
  { id: "claude-sonnet-4", label: "Sonnet 4" },
  { id: "claude-opus-4", label: "Opus 4" },
  { id: "claude-opus-4-5-20250918", label: "Opus 4.5" },
  { id: "claude-opus-4-6", label: "Opus 4.6" },
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { id: "gpt-4", label: "GPT-4" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];
