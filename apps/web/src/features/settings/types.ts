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
  /** @deprecated Retained for persisted-settings migration — use
   * `generationMode` + `critiqueMode`. */
  quickMode: boolean;
  generationMode?: "fast" | "detailed";
  showZoomControls: boolean;
  providers: ProviderConfig[];
  ideateModel?: string;
  isIdeating: boolean;
  /** @deprecated Use conceptCount instead */
  variations: number;
  /** Critique loop toggle — sequential frames with per-frame review +
   * critique feedback. Applies to both generation modes. */
  critiqueMode: boolean;
  selectedImages: SelectedImage[];
  theme: Theme;
  onboardingCompleted: boolean;
  analyticsEnabled: boolean;
}
