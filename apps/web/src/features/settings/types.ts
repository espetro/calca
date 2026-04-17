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
}

export interface Settings {
  apiKey: string;
  geminiKey: string;
  unsplashKey: string;
  openaiKey: string;
  providerType: ProviderType | undefined;
  baseURL: string;
  model: string;
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
}

export const FALLBACK_MODELS: ModelInfo[] = [
  { id: "claude-opus-4-6", displayName: "claude-opus-4-6", description: "" },
  { id: "claude-sonnet-4-5", displayName: "claude-sonnet-4-5", description: "" },
  { id: "claude-opus-4", displayName: "claude-opus-4", description: "" },
  { id: "claude-sonnet-4", displayName: "claude-sonnet-4", description: "" },
];
