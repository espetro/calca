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

export const FALLBACK_MODELS: ModelInfo[] = [
  { id: "claude-opus-4-6", displayName: "claude-opus-4-6", description: "" },
  { id: "claude-sonnet-4-5", displayName: "claude-sonnet-4-5", description: "" },
  { id: "claude-opus-4", displayName: "claude-opus-4", description: "" },
  { id: "claude-sonnet-4", displayName: "claude-sonnet-4", description: "" },
];
