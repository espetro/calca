import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProviderType } from "@app/core/ai/providers";
import type { ProviderConfig, Settings } from "../types";
import { settingsSchema } from "../lib/settings-schema";
import { deriveProviderFields } from "../lib/derive-provider-fields";

const STORAGE_KEY = "calca-settings";
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL ?? "qwen3.5-4b";
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
    models: modelName ? [{ id: modelName, displayName: modelName, description: "" }] : [],
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
    model: envProvider ? `${ENV_PROVIDER_ID}/${DEFAULT_MODEL}` : DEFAULT_MODEL,
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
    theme: "system",
    onboardingCompleted: false,
    analyticsEnabled: true,
  };
};

const migrateModelFormat = (parsed: Partial<Settings>): Partial<Settings> => {
  const updates: Partial<Settings> = {};
  const providers = parsed.providers ?? [];
  const envProvider = providers.find((p) => p.isEnv);
  const firstProvider = providers[0];
  const targetProvider = envProvider ?? firstProvider;

  if (!targetProvider) return updates;

  if (parsed.model && !parsed.model.includes("/")) {
    updates.model = `${targetProvider.id}/${parsed.model}`;
  }

  if (parsed.ideateModel && !parsed.ideateModel.includes("/")) {
    updates.ideateModel = `${targetProvider.id}/${parsed.ideateModel}`;
  }

  return updates;
};

const createStorage = () => {
  const defaults = createDefaultSettings();
  let cachedSettings: Settings | null = null;

  const storage = {
    getItem: (key: string): Settings => {
      if (cachedSettings) return cachedSettings;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          cachedSettings = defaults;
          return cachedSettings;
        }
        const parsed = JSON.parse(raw);
        const result = settingsSchema.safeParse(parsed);
        if (!result.success) {
          console.warn("[settings] Schema validation failed, using defaults:", result.error.flatten());
          cachedSettings = defaults;
          return cachedSettings;
        }
        const migrated = migrateModelFormat(result.data);
        const merged = { ...defaults, ...result.data, ...migrated };
        const envProvider = createEnvProvider();
        if (envProvider && !merged.providers.some((p) => p.isEnv)) {
          merged.providers = [envProvider, ...merged.providers];
        }
        cachedSettings = merged;
        return cachedSettings;
      } catch {
        cachedSettings = defaults;
        return cachedSettings;
      }
    },
    setItem: (key: string, value: Settings) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        cachedSettings = value;
      } catch {}
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
        cachedSettings = null;
      } catch {}
    },
  };
  return storage;
};

export const settingsAtom = atomWithStorage<Settings>(
  STORAGE_KEY,
  createDefaultSettings(),
  createStorage(),
);

export const isOwnKeyAtom = atom((get) => {
  const settings = get(settingsAtom);
  const derived = deriveProviderFields(settings.providers, settings.model);
  return !!derived.apiKey || (derived.providerType === "openai-compatible" && !!derived.baseURL);
});

export const hasGeminiKeyAtom = atom((get) => {
  const settings = get(settingsAtom);
  return !!settings.geminiKey;
});

export const loadedAtom = atom(true);

export const updateSettingsAtom = atom(null, (_get, set, update: Partial<Settings>) => {
  set(settingsAtom, (prev) => ({ ...prev, ...update }));
});
