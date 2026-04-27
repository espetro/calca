import { useCallback, useEffect, useState } from "react";
import type { ModelInfo, ProviderConfig, ProviderType, SelectedImage, Settings } from "../types";
import { FALLBACK_MODELS } from "../types";
import { migrateSettings } from "../lib/migrate-settings";
import { deriveProviderFields } from "../lib/derive-provider-fields";
import { useProbeModels } from "./use-probe-models";

export type { ProviderType, Settings, SelectedImage };
export { FALLBACK_MODELS };

const STORAGE_KEY = "calca-settings";
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || "claude-opus-4-6";
const DEFAULT_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "";
const DEFAULT_API_KEY = import.meta.env.VITE_AI_API_KEY || "";

const ENV_PROVIDER_ID = "environment";

const createEnvProvider = (): ProviderConfig | null => {
  const baseUrl = import.meta.env.VITE_AI_BASE_URL;
  if (!baseUrl) {return null;}

  const modelName = import.meta.env.VITE_AI_MODEL;
  return {
    apiKey: import.meta.env.VITE_AI_API_KEY || "",
    apiType: "openai-compatible",
    baseUrl,
    id: ENV_PROVIDER_ID,
    isEnv: true,
    lastTested: null,
    models: modelName ? [{ id: modelName, displayName: modelName, description: "" }] : [],
  };
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>({
    apiKey: DEFAULT_API_KEY,
    baseURL: DEFAULT_BASE_URL,
    conceptCount: 4,
    critiqueMode: false,
    geminiKey: "",
    ideateModel: undefined,
    isIdeating: false,
    model: DEFAULT_MODEL,
    onboardingCompleted: false,
    openaiKey: "",
    providerType: createEnvProvider() ? "openai-compatible" : undefined,
    providers: [],
    quickMode: false,
    selectedImages: [],
    showZoomControls: false,
    systemPrompt: "",
    systemPromptPreset: "custom",
    theme: "system",
    unsplashKey: "",
    variations: 1,
  });
  const [loaded, setLoaded] = useState(false);
  const probeModels = useProbeModels();

  // Load settings from localStorage (fall back to env defaults)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let parsed = JSON.parse(raw);

        const migrated = migrateSettings(parsed);
        if (migrated) {
          parsed = { ...parsed, ...migrated };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }

        let providers = parsed.providers ?? [];
        const envProvider = createEnvProvider();

        // Always ensure env provider is present if env vars are set
        if (envProvider && !providers.some((p: ProviderConfig) => p.isEnv)) {
          providers = [envProvider, ...providers];
        }

        // Auto-migrate stale settings: if user has env config but settings
        // Are pointing to anthropic without an API key, switch to env provider
        const hasEnvConfig = Boolean(DEFAULT_BASE_URL);
        const isStaleAnthropic = parsed.providerType === "anthropic" && !parsed.apiKey;
        if (hasEnvConfig && isStaleAnthropic && envProvider) {
          parsed.providerType = envProvider.apiType;
          parsed.baseURL = envProvider.baseUrl;
          parsed.apiKey = envProvider.apiKey;
          parsed.model = DEFAULT_MODEL;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }

        setSettingsState({
          apiKey: parsed.apiKey ?? DEFAULT_API_KEY,
          baseURL: parsed.baseURL ?? DEFAULT_BASE_URL,
          conceptCount: parsed.conceptCount ?? 4,
          critiqueMode: parsed.critiqueMode ?? false,
          geminiKey: parsed.geminiKey ?? "",
          ideateModel: parsed.ideateModel,
          isIdeating: parsed.isIdeating ?? false,
          model: parsed.model ?? DEFAULT_MODEL,
          onboardingCompleted: false,
          openaiKey: parsed.openaiKey ?? "",
          providerType: parsed.providerType,
          providers,
          quickMode: parsed.quickMode ?? false,
          selectedImages: parsed.selectedImages ?? [],
          showZoomControls: parsed.showZoomControls ?? false,
          systemPrompt: parsed.systemPrompt ?? "",
          systemPromptPreset: parsed.systemPromptPreset ?? "custom",
          theme: (parsed.theme as Settings["theme"]) ?? "system",
          unsplashKey: parsed.unsplashKey ?? "",
          variations: parsed.variations ?? 1,
        });
      } else {
        // No localStorage yet — seed env provider if env vars are set
        const envProvider = createEnvProvider();
        if (envProvider) {
          setSettingsState((prev) => ({ ...prev, providers: [envProvider] }));
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  const setSettings = useCallback((update: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...update };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const testProvider = useCallback(
    async (
      config: Omit<ProviderConfig, "models" | "lastTested">,
    ): Promise<{ models: ModelInfo[]; error?: string }> => probeModels.mutateAsync({
        apiKey: config.apiKey,
        providerType: config.apiType,
        baseURL: config.baseUrl,
      }),
    [probeModels.mutateAsync],
  );

  const setIsIdeating = useCallback(
    (value: boolean) => {
      setSettings({ isIdeating: value });
    },
    [setSettings],
  );

  const addImage = useCallback((image: SelectedImage) => {
    setSettingsState((prev) => {
      const next = { ...prev, selectedImages: [...prev.selectedImages, image] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setSettingsState((prev) => {
      const next = { ...prev, selectedImages: prev.selectedImages.filter((img) => img.id !== id) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearImages = useCallback(() => {
    setSettings({ selectedImages: [] });
  }, [setSettings]);

  const derived = deriveProviderFields(settings.providers, settings.model);

  // For anthropic we need an API key; for openai-compatible a baseURL is enough
  const isOwnKey =
    Boolean(derived.apiKey) || (derived.providerType === "openai-compatible" && Boolean(derived.baseURL));
  const hasGeminiKey = Boolean(settings.geminiKey);

  return {
    addImage,
    clearImages,
    hasGeminiKey,
    isOwnKey,
    loaded,
    providers: settings.providers,
    removeImage,
    setIsIdeating,
    setSettings,
    settings: {
      ...settings,
      ...derived,
    },
    testProvider,
  };
}
