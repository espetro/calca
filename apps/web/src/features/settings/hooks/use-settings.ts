"use client";

import { useState, useCallback, useEffect } from "react";
import type { ProviderType, ProviderConfig, ModelInfo, Settings, SelectedImage } from "../types";
import { FALLBACK_MODELS } from "../types";
import { migrateSettings, MigratedSettings } from "../lib/migrate-settings";
import { deriveProviderFields } from "../lib/derive-provider-fields";
import { useProbeModels } from "./use-probe-models";

export type { ProviderType, Settings, SelectedImage };
export { FALLBACK_MODELS };

const STORAGE_KEY = "otto-settings";
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || "claude-opus-4-6";
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL || "";
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || "";

const ENV_PROVIDER_ID = "environment";

const createEnvProvider = (): ProviderConfig | null => {
  const baseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;
  if (!baseUrl) return null;

  const modelName = process.env.NEXT_PUBLIC_AI_MODEL;
  return {
    id: ENV_PROVIDER_ID,
    apiType: "openai-compatible",
    baseUrl,
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || "",
    models: modelName
      ? [{ id: modelName, displayName: modelName, description: "" }]
      : [],
    lastTested: null,
    isEnv: true,
  };
};

export const MODELS = [
  { id: "claude-opus-4-6", label: "Opus 4.6", desc: "Best quality, slowest" },
  { id: "claude-opus-4-5-20250918", label: "Opus 4.5", desc: "Creative + powerful" },
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5", desc: "Fast + great" },
  { id: "claude-opus-4", label: "Opus 4", desc: "High quality, slower" },
  { id: "claude-sonnet-4", label: "Sonnet 4", desc: "Fast, reliable" },
] as const;

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>({
    apiKey: DEFAULT_API_KEY,
    geminiKey: "",
    unsplashKey: "",
    openaiKey: "",
    providerType: createEnvProvider() ? "openai-compatible" : undefined,
    baseURL: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
    systemPrompt: "",
    systemPromptPreset: "custom",
    conceptCount: 4,
    quickMode: false,
    showZoomControls: false,
    providers: [],
    ideateModel: undefined,
    isIdeating: false,
    variations: 1,
    critiqueMode: false,
    selectedImages: [],
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
        // are pointing to anthropic without an API key, switch to env provider
        const hasEnvConfig = !!DEFAULT_BASE_URL;
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
          geminiKey: parsed.geminiKey ?? "",
          unsplashKey: parsed.unsplashKey ?? "",
          openaiKey: parsed.openaiKey ?? "",
          providerType: parsed.providerType,
          baseURL: parsed.baseURL ?? DEFAULT_BASE_URL,
          model: parsed.model ?? DEFAULT_MODEL,
          systemPrompt: parsed.systemPrompt ?? "",
          systemPromptPreset: parsed.systemPromptPreset ?? "custom",
          conceptCount: parsed.conceptCount ?? 4,
          quickMode: parsed.quickMode ?? false,
          showZoomControls: parsed.showZoomControls ?? false,
          providers,
          ideateModel: parsed.ideateModel,
          isIdeating: parsed.isIdeating ?? false,
          variations: parsed.variations ?? 1,
          critiqueMode: parsed.critiqueMode ?? false,
          selectedImages: parsed.selectedImages ?? [],
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

  const testProvider = useCallback(async (
    config: Omit<ProviderConfig, "models" | "lastTested">
  ): Promise<{ models: ModelInfo[]; error?: string }> => {
    return probeModels.mutateAsync({
      apiKey: config.apiKey,
      providerType: config.apiType,
      baseURL: config.baseUrl,
    });
  }, [probeModels.mutateAsync]);

  const setIsIdeating = useCallback((value: boolean) => {
    setSettings({ isIdeating: value });
  }, [setSettings]);

  const setVariations = useCallback((value: number) => {
    setSettings({ variations: Math.max(1, Math.min(4, value)) });
  }, [setSettings]);

  const setCritiqueMode = useCallback((value: boolean) => {
    setSettings({ critiqueMode: value });
  }, [setSettings]);

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
    !!derived.apiKey ||
    (derived.providerType === "openai-compatible" && !!derived.baseURL);
  const hasGeminiKey = !!settings.geminiKey;

  return {
    settings: {
      ...settings,
      ...derived,
    },
    setSettings,
    setIsIdeating,
    setVariations,
    setCritiqueMode,
    addImage,
    removeImage,
    clearImages,
    isOwnKey,
    hasGeminiKey,
    loaded,
    providers: settings.providers,
    testProvider,
  };
}
