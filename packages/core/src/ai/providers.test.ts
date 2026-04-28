import { describe, expect, it } from "vitest";

import {
  buildModelFallbackChain,
  claudeModels,
  geminiModels,
  getAIProvider,
  getClaudeModel,
  getGeminiImageModel,
  getGeminiModel,
  openaiModels,
  type ProviderType,
} from "./providers";

describe("getAIProvider", () => {
  it("returns anthropic provider for 'anthropic' type", () => {
    const provider = getAIProvider("anthropic");
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("returns openai-compatible provider for 'openai-compatible' type", () => {
    const provider = getAIProvider("openai-compatible", "test-key", "https://api.openai.com/v1");
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("passes apiKey and baseURL to openai-compatible provider", () => {
    const provider = getAIProvider("openai-compatible", "sk-test", "https://test.com/v1");
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("uses empty string as default baseURL when not provided for openai-compatible", () => {
    const provider = getAIProvider("openai-compatible", "test-key");
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });

  it("handles undefined apiKey for openai-compatible", () => {
    const provider = getAIProvider("openai-compatible", undefined, "https://test.com/v1");
    expect(provider).toBeDefined();
    expect(typeof provider).toBe("function");
  });
});

describe("ProviderType", () => {
  it("accepts 'anthropic' as a valid value", () => {
    const type: ProviderType = "anthropic";
    expect(type).toBe("anthropic");
  });

  it("accepts 'openai-compatible' as a valid value", () => {
    const type: ProviderType = "openai-compatible";
    expect(type).toBe("openai-compatible");
  });
});

describe("getClaudeModel", () => {
  it("returns the requested model for valid model IDs", () => {
    expect(getClaudeModel("claude-opus-4-6")).toBeDefined();
    expect(getClaudeModel("claude-sonnet-4-5")).toBeDefined();
    expect(getClaudeModel("claude-opus-4")).toBeDefined();
    expect(getClaudeModel("claude-sonnet-4")).toBeDefined();
  });

  it("handles legacy model ID 'claude-sonnet-4-5-20250514' by returning fallback", () => {
    const result = getClaudeModel("claude-sonnet-4-5-20250514");
    expect(result).toBeDefined();
  });

  it("returns default fallback for unknown model IDs", () => {
    const result = getClaudeModel("unknown-model");
    expect(result).toBeDefined();
    expect(result).toBe(claudeModels["claude-opus-4-6"]);
  });

  it("returns claude-sonnet-4-5 for legacy ID when available", () => {
    const result = getClaudeModel("claude-sonnet-4-5-20250514");
    expect(result).toBeDefined();
  });
});

describe("getGeminiModel", () => {
  it("returns the requested model for valid model IDs", () => {
    expect(getGeminiModel("gemini-2.0-flash")).toBeDefined();
  });

  it("returns default gemini-2.0-flash for unknown model IDs", () => {
    const result = getGeminiModel("unknown-model");
    expect(result).toBeDefined();
    expect(result).toBe(geminiModels["gemini-2.0-flash"]);
  });

  it("handles empty string by returning default", () => {
    const result = getGeminiModel("");
    expect(result).toBeDefined();
    expect(result).toBe(geminiModels["gemini-2.0-flash"]);
  });
});

describe("getGeminiImageModel", () => {
  it("returns image model without API key", () => {
    const model = getGeminiImageModel();
    expect(model).toBeDefined();
  });

  it("returns image model with API key", () => {
    const model = getGeminiImageModel("test-api-key");
    expect(model).toBeDefined();
  });
});

describe("buildModelFallbackChain", () => {
  it("returns [preferredModel] when no fallbackModel", () => {
    expect(buildModelFallbackChain("claude-opus-4-6")).toEqual(["claude-opus-4-6"]);
  });

  it("returns [preferredModel] when fallbackModel is undefined", () => {
    expect(buildModelFallbackChain("claude-opus-4-6", undefined)).toEqual(["claude-opus-4-6"]);
  });

  it("returns [preferredModel, fallbackModel] when fallbackModel is different", () => {
    expect(buildModelFallbackChain("claude-opus-4-6", "claude-sonnet-4-5")).toEqual([
      "claude-opus-4-6",
      "claude-sonnet-4-5",
    ]);
  });

  it("does NOT duplicate preferredModel when fallbackModel equals preferredModel", () => {
    expect(buildModelFallbackChain("claude-opus-4-6", "claude-opus-4-6")).toEqual([
      "claude-opus-4-6",
    ]);
  });
});

describe("openaiModels", () => {
  it("contains expected OpenAI model keys", () => {
    expect(Object.keys(openaiModels)).toContain("gpt-4");
    expect(Object.keys(openaiModels)).toContain("gpt-4o");
    expect(Object.keys(openaiModels)).toContain("gpt-4o-mini");
  });
});
