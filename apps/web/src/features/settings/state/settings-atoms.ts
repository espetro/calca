import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProviderType } from "@app/core/ai/providers";
import type { ProviderConfig, Settings } from "../types";
import { deriveProviderFields } from "../lib/derive-provider-fields";

const STORAGE_KEY = "otto-settings";
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || "claude-opus-4-6";
const DEFAULT_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "";
const DEFAULT_API_KEY = import.meta.env.VITE_AI_API_KEY || "";

const ENV_PROVIDER_ID = "environment";

const createEnvProvider = (): ProviderConfig | null => {
  const baseUrl = import.meta.env.VITE_AI_BASE_URL;
  if (!baseUrl) return null;

  const modelName = import.meta.env.VITE_AI_MODEL;
  return {
    id: ENV_PROVIDER_ID,
    apiType: "openai-compatible",
    baseUrl,
    apiKey: import.meta.env.VITE_AI_API_KEY || "",
    models: modelName
      ? [{ id: modelName, displayName: modelName, description: "" }]
      : [],
    lastTested: null,
    isEnv: true,
  };
};

const createDefaultSettings = (): Settings => {
  const envProvider = createEnvProvider();

  return {
    apiKey: DEFAULT_API_KEY,
    geminiKey: "",
    unsplashKey: "",
    openaiKey: "",
    providerType: envProvider ? ("openai-compatible" as ProviderType) : undefined,
    baseURL: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
    systemPrompt: "",
    systemPromptPreset: "custom",
    conceptCount: 4,
    quickMode: false,
    showZoomControls: false,
    providers: envProvider ? [envProvider] : [],
    ideateModel: undefined,
    isIdeating: false,
    variations: 1,
    critiqueMode: false,
    selectedImages: [],
  };
};

export const settingsAtom = atomWithStorage<Settings>(
  STORAGE_KEY,
  createDefaultSettings()
);

export const isOwnKeyAtom = atom((get) => {
  const settings = get(settingsAtom);
  const derived = deriveProviderFields(settings.providers, settings.model);
  return (
    !!derived.apiKey ||
    (derived.providerType === "openai-compatible" && !!derived.baseURL)
  );
});

export const hasGeminiKeyAtom = atom((get) => {
  const settings = get(settingsAtom);
  return !!settings.geminiKey;
});

export const loadedAtom = atom(true);

export const updateSettingsAtom = atom(
  null,
  (_get, set, update: Partial<Settings>) => {
    set(settingsAtom, (prev) => ({ ...prev, ...update }));
  }
);
