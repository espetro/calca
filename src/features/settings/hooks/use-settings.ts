"use client";

import { useState, useCallback, useEffect } from "react";
import type { ProviderType } from "@app/core/ai/providers";
import type {
  ProviderConfig,
  ModelInfo,
} from "../types";
import { FALLBACK_MODELS } from "../types";
import { migrateSettings, MigratedSettings } from "../lib/migrate-settings";
import { deriveProviderFields } from "../lib/derive-provider-fields";

export type { ProviderType };

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
  variations: number;
  critiqueMode: boolean;
  selectedImages: SelectedImage[];
}

export { FALLBACK_MODELS };

const STORAGE_KEY = "otto-settings";
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || "claude-opus-4-6";
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL || "";
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || "";

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
    providerType: undefined,
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
          providers: parsed.providers ?? [],
          ideateModel: parsed.ideateModel,
          isIdeating: parsed.isIdeating ?? false,
          variations: parsed.variations ?? 1,
          critiqueMode: parsed.critiqueMode ?? false,
          selectedImages: parsed.selectedImages ?? [],
        });
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
    try {
      const res = await fetch("/api/probe-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.apiKey,
          providerType: config.apiType,
          baseURL: config.baseUrl,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { models: [], error: text || `HTTP ${res.status}` };
      }

      const data = await res.json();
      const available = data.available as Record<string, boolean> | undefined;

      if (!available) {
        return { models: FALLBACK_MODELS };
      }

      const models: ModelInfo[] = Object.entries(available)
        .filter(([, isAvailable]) => isAvailable)
        .map(([id]) => ({
          id,
          displayName: id,
          description: "",
        }));

      if (models.length === 0) {
        return { models: FALLBACK_MODELS };
      }

      return { models };
    } catch (error) {
      return {
        models: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

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
