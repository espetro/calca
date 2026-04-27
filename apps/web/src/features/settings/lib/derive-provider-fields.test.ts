import { describe, it, expect } from "vitest";
import { deriveProviderFields, type DerivedProviderFields } from "./derive-provider-fields";
import type { ProviderConfig } from "../types";

const createProvider = (overrides: Partial<ProviderConfig> = {}): ProviderConfig => ({
  id: "default",
  apiType: "anthropic",
  baseUrl: "",
  apiKey: "",
  models: [],
  lastTested: null,
  ...overrides,
});

describe("deriveProviderFields", () => {
  it("extracts fields from matching provider when model has provider prefix", () => {
    const providers: ProviderConfig[] = [
      createProvider({
        id: "custom",
        apiType: "openai-compatible",
        baseUrl: "https://custom.api.com",
        apiKey: "custom-key",
      }),
    ];

    const result = deriveProviderFields(providers, "custom/gpt-4");

    expect(result).toEqual({
      apiKey: "custom-key",
      providerType: "openai-compatible",
      baseURL: "https://custom.api.com",
      model: "gpt-4",
    });
  });

  it("returns modelId without prefix when provider matches", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "provider1", apiKey: "key1", baseUrl: "https://p1.com" }),
    ];

    const result = deriveProviderFields(providers, "provider1/model-name");

    expect(result.model).toBe("model-name");
  });

  it("falls back to environment provider when prefix doesn't match any provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "env", isEnv: true, apiKey: "env-key", baseUrl: "https://env.com" }),
    ];

    const result = deriveProviderFields(providers, "unknown/model");

    expect(result).toEqual({
      apiKey: "env-key",
      providerType: "anthropic",
      baseURL: "https://env.com",
      model: "model",
    });
  });

  it("falls back to provider with baseUrl when prefix doesn't match", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "with-url", baseUrl: "https://api.test.com", apiKey: "test-key" }),
    ];

    const result = deriveProviderFields(providers, "unknown/model");

    expect(result.baseURL).toBe("https://api.test.com");
    expect(result.apiKey).toBe("test-key");
  });

  it("returns anthropic defaults when no matching provider and no prefix", () => {
    const providers: ProviderConfig[] = [createProvider({ id: "empty" })];

    const result = deriveProviderFields(providers, "unknown-model");

    expect(result).toEqual({
      apiKey: "",
      providerType: "anthropic",
      baseURL: "",
      model: "unknown-model",
    });
  });

  it("returns anthropic defaults when providers array is empty", () => {
    const result = deriveProviderFields([], "any-model");

    expect(result).toEqual({
      apiKey: "",
      providerType: "anthropic",
      baseURL: "",
      model: "any-model",
    });
  });

  it("handles model without prefix by using environment provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "env", isEnv: true, apiKey: "env-key", baseUrl: "https://env.com" }),
    ];

    const result = deriveProviderFields(providers, "claude-sonnet-4-5");

    expect(result).toEqual({
      apiKey: "env-key",
      providerType: "anthropic",
      baseURL: "https://env.com",
      model: "claude-sonnet-4-5",
    });
  });

  it("prefers explicit provider match over environment provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "env", isEnv: true, apiKey: "env-key", baseUrl: "https://env.com" }),
      createProvider({ id: "explicit", apiKey: "explicit-key", baseUrl: "https://explicit.com" }),
    ];

    const result = deriveProviderFields(providers, "explicit/model");

    expect(result.apiKey).toBe("explicit-key");
    expect(result.baseURL).toBe("https://explicit.com");
  });

  it("handles multiple slashes in model name (uses first segment as provider)", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "first", apiKey: "first-key", baseUrl: "https://first.com" }),
    ];

    const result = deriveProviderFields(providers, "first/model/extra");

    expect(result.model).toBe("model/extra");
    expect(result.apiKey).toBe("first-key");
  });

  it("handles model starting with slash (empty provider ID)", () => {
    const providers: ProviderConfig[] = [
      createProvider({ id: "env", isEnv: true, apiKey: "env-key" }),
    ];

    const result = deriveProviderFields(providers, "/model-name");

    expect(result.model).toBe("/model-name");
  });

  it("preserves providerType from matched provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({
        id: "openai",
        apiType: "openai-compatible",
        apiKey: "key",
        baseUrl: "https://openai.com",
      }),
    ];

    const result = deriveProviderFields(providers, "openai/gpt-4");

    expect(result.providerType).toBe("openai-compatible");
  });

  it("returns empty strings for missing credentials", () => {
    const providers: ProviderConfig[] = [createProvider({ id: "empty", apiKey: "", baseUrl: "" })];

    const result = deriveProviderFields(providers, "empty/model");

    expect(result.apiKey).toBe("");
    expect(result.baseURL).toBe("");
  });

  it("never throws on edge cases", () => {
    expect(() => deriveProviderFields([], "")).not.toThrow();
    expect(() => deriveProviderFields([createProvider()], "")).not.toThrow();
    expect(() => deriveProviderFields([], "no/provider/here")).not.toThrow();
  });
});
