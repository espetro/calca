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
}

export const FALLBACK_MODELS: ModelInfo[] = [
  { description: "", displayName: "claude-opus-4-6", id: "claude-opus-4-6" },
  { description: "", displayName: "claude-sonnet-4-5", id: "claude-sonnet-4-5" },
  { description: "", displayName: "claude-opus-4", id: "claude-opus-4" },
  { description: "", displayName: "claude-sonnet-4", id: "claude-sonnet-4" },
];

export const MODELS = [
  { desc: "Best quality, slowest", id: "claude-opus-4-6", label: "Opus 4.6" },
  { desc: "Creative + powerful", id: "claude-opus-4-5-20250918", label: "Opus 4.5" },
  { desc: "Fast + great", id: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { desc: "High quality, slower", id: "claude-opus-4", label: "Opus 4" },
  { desc: "Fast, reliable", id: "claude-sonnet-4", label: "Sonnet 4" },
] as const;
