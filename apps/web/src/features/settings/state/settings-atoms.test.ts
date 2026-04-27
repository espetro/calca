import { describe, it, expect } from "vitest";
import { atom } from "jotai";
import { settingsSchema } from "../lib/settings-schema";

const ENV_PROVIDER_ID = "environment";
const DEFAULT_BASE_URL = "";
const DEFAULT_API_KEY = "";

const createEnvProvider = () => null;

const createDefaultSettings = () => ({
  apiKey: DEFAULT_API_KEY,
  geminiKey: "",
  unsplashKey: "",
  openaiKey: "",
  providerType: createEnvProvider() ? ("openai-compatible" as const) : undefined,
  baseURL: DEFAULT_BASE_URL,
  model: createEnvProvider() ? `${ENV_PROVIDER_ID}/` : "",
  systemPrompt: "",
  systemPromptPreset: "custom",
  conceptCount: 4,
  quickMode: false,
  showZoomControls: false,
  providers: createEnvProvider() ? [createEnvProvider()!] : [],
  ideateModel: undefined,
  isIdeating: false,
  variations: 1,
  critiqueMode: false,
  selectedImages: [] as Array<{ id: string; src: string; name?: string }>,
  theme: "system" as const,
  onboardingCompleted: false,
});

describe("settings-atoms defaults", () => {
  it("createDefaultSettings returns system theme", () => {
    expect(createDefaultSettings().theme).toBe("system");
  });

  it("createDefaultSettings returns onboardingCompleted false", () => {
    expect(createDefaultSettings().onboardingCompleted).toBe(false);
  });

  it("createDefaultSettings returns correct conceptCount", () => {
    expect(createDefaultSettings().conceptCount).toBe(4);
  });

  it("createDefaultSettings returns quickMode false", () => {
    expect(createDefaultSettings().quickMode).toBe(false);
  });

  it("createDefaultSettings returns empty providers when no env provider", () => {
    expect(createDefaultSettings().providers).toEqual([]);
  });

  it("createDefaultSettings returns empty model when no env provider", () => {
    expect(createDefaultSettings().model).toBe("");
  });
});

describe("settingsSchema Zod validation", () => {
  it("safeParse accepts valid settings data", () => {
    const result = settingsSchema.safeParse({
      apiKey: "test-key",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      providerType: "anthropic",
      baseURL: "https://api.anthropic.com",
      model: "claude-sonnet-4-5",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [
        {
          id: "default",
          apiType: "anthropic",
          baseUrl: "https://api.anthropic.com",
          apiKey: "test-key",
          models: [],
          lastTested: null,
        },
      ],
      ideateModel: undefined,
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "dark",
      onboardingCompleted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe("dark");
      expect(result.data.onboardingCompleted).toBe(true);
    }
  });

  it("safeParse rejects invalid theme", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "invalid-theme",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(false);
  });

  it("safeParse rejects invalid providerType", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      providerType: "invalid-provider",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "system",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(false);
  });

  it("safeParse accepts minimal valid settings", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "system",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(true);
  });

  it("safeParse rejects conceptCount that is not a number", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: "four",
      quickMode: false,
      showZoomControls: false,
      providers: [],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "system",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(false);
  });

  it("safeParse accepts valid provider config in providers array", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [
        {
          id: "custom",
          apiType: "openai-compatible",
          baseUrl: "https://custom.api.com",
          apiKey: "custom-key",
          models: [{ id: "gpt-4", displayName: "GPT-4", description: "" }],
          lastTested: 1234567890,
        },
      ],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "system",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.providers[0]?.id).toBe("custom");
    }
  });

  it("safeParse rejects invalid provider in providers array", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      geminiKey: "",
      unsplashKey: "",
      openaiKey: "",
      baseURL: "",
      model: "test",
      systemPrompt: "",
      systemPromptPreset: "custom",
      conceptCount: 4,
      quickMode: false,
      showZoomControls: false,
      providers: [
        {
          id: "bad",
          apiType: "not-valid",
          baseUrl: "https://example.com",
          apiKey: "key",
          models: [],
          lastTested: null,
        },
      ],
      isIdeating: false,
      variations: 1,
      critiqueMode: false,
      selectedImages: [],
      theme: "system",
      onboardingCompleted: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsAtom derived atoms", () => {
  it("settings merge produces correct values", () => {
    const defaults = createDefaultSettings();
    const override = { theme: "dark" as const, conceptCount: 8 };
    const merged = { ...defaults, ...override };

    expect(merged.theme).toBe("dark");
    expect(merged.conceptCount).toBe(8);
    expect(merged.onboardingCompleted).toBe(false);
    expect(merged.quickMode).toBe(false);
  });

  it("settings partial override preserves missing fields", () => {
    const defaults = createDefaultSettings();
    const override = { theme: "light" as const };
    const merged = { ...defaults, ...override };

    expect(merged.theme).toBe("light");
    expect(merged.onboardingCompleted).toBe(false);
    expect(merged.quickMode).toBe(false);
    expect(merged.conceptCount).toBe(4);
  });
});
