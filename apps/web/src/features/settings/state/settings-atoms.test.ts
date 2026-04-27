import { describe, expect, it } from "vitest";
import { atom } from "jotai";
import { settingsSchema } from "../lib/settings-schema";

const DEFAULT_MODEL = "qwen3.5-4b";
const DEFAULT_BASE_URL = "";
const DEFAULT_API_KEY = "";

const createEnvProvider = () => null;

const createDefaultSettings = () => ({
  apiKey: DEFAULT_API_KEY,
  baseURL: DEFAULT_BASE_URL,
  conceptCount: 4,
  critiqueMode: false,
  geminiKey: "",
  ideateModel: undefined,
  isIdeating: false,
  model: createEnvProvider() ? `environment/${DEFAULT_MODEL}` : DEFAULT_MODEL,
  onboardingCompleted: false,
  openaiKey: "",
  providerType: createEnvProvider() ? ("openai-compatible" as const) : undefined,
  providers: createEnvProvider() ? [createEnvProvider()!] : [],
  quickMode: false,
  selectedImages: [] as Array<{ id: string; src: string; name?: string }>,
  showZoomControls: false,
  systemPrompt: "",
  systemPromptPreset: "custom",
  theme: "system" as const,
  unsplashKey: "",
  variations: 1,
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

  it("createDefaultSettings returns model without prefix when no env provider", () => {
    expect(createDefaultSettings().model).toBe("qwen3.5-4b");
  });
});

describe("settingsSchema Zod validation", () => {
  it("safeParse accepts valid settings data", () => {
    const result = settingsSchema.safeParse({
      apiKey: "test-key",
      baseURL: "https://api.anthropic.com",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      ideateModel: undefined,
      isIdeating: false,
      model: "claude-sonnet-4-5",
      onboardingCompleted: true,
      openaiKey: "",
      providerType: "anthropic",
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
      quickMode: false,
      selectedImages: [],
      showZoomControls: false,
      systemPrompt: "",
      systemPromptPreset: "custom",
      theme: "dark",
      unsplashKey: "",
      variations: 1,
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
      baseURL: "",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
      providers: [],
      quickMode: false,
      selectedImages: [],
      showZoomControls: false,
      systemPrompt: "",
      systemPromptPreset: "custom",
      theme: "invalid-theme",
      unsplashKey: "",
      variations: 1,
    });
    expect(result.success).toBe(false);
  });

  it("safeParse rejects invalid providerType", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      baseURL: "",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
      providerType: "invalid-provider",
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
    expect(result.success).toBe(false);
  });

  it("safeParse accepts minimal valid settings", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      baseURL: "",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
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
    expect(result.success).toBe(true);
  });

  it("safeParse rejects conceptCount that is not a number", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      baseURL: "",
      conceptCount: "four",
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
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
    expect(result.success).toBe(false);
  });

  it("safeParse accepts valid provider config in providers array", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      baseURL: "",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
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
      quickMode: false,
      selectedImages: [],
      showZoomControls: false,
      systemPrompt: "",
      systemPromptPreset: "custom",
      theme: "system",
      unsplashKey: "",
      variations: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.providers[0]?.id).toBe("custom");
    }
  });

  it("safeParse rejects invalid provider in providers array", () => {
    const result = settingsSchema.safeParse({
      apiKey: "",
      baseURL: "",
      conceptCount: 4,
      critiqueMode: false,
      geminiKey: "",
      isIdeating: false,
      model: "test",
      onboardingCompleted: false,
      openaiKey: "",
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
      quickMode: false,
      selectedImages: [],
      showZoomControls: false,
      systemPrompt: "",
      systemPromptPreset: "custom",
      theme: "system",
      unsplashKey: "",
      variations: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsAtom derived atoms", () => {
  it("settings merge produces correct values", () => {
    const defaults = createDefaultSettings();
    const override = { conceptCount: 8, theme: "dark" as const };
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
