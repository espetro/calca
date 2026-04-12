import { describe, it, expect } from "bun:test";
import { getAIProvider, type ProviderType } from "./providers";

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
