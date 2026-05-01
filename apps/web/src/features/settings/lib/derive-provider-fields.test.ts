import { describe, expect, it } from "vitest";

import type { ProviderConfig } from "../types";
import { type DerivedProviderFields, deriveProviderFields } from "./derive-provider-fields";

const createProvider = (overrides: Partial<ProviderConfig> = {}): ProviderConfig => ({
  apiKey: "",
  apiType: "anthropic",
  baseUrl: "",
  id: "default",
  lastTested: null,
  models: [],
  ...overrides,
});

describe("deriveProviderFields", () => {
  it("extracts fields from matching provider when model has provider prefix", () => {
    const providers: ProviderConfig[] = [
      createProvider({
        apiKey: "custom-key",
        apiType: "openai-compatible",
        baseUrl: "https://custom.api.com",
        id: "custom",
      }),
    ];

    const result = deriveProviderFields(providers, "custom/gpt-4");

    expect(result).toEqual({
      apiKey: "custom-key",
      baseURL: "https://custom.api.com",
      model: "gpt-4",
      providerType: "openai-compatible",
    });
  });

  it("returns modelId without prefix when provider matches", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "key1", baseUrl: "https://p1.com", id: "provider1" }),
    ];

    const result = deriveProviderFields(providers, "provider1/model-name");

    expect(result.model).toBe("model-name");
  });

  it("falls back to environment provider when prefix doesn't match any provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "env-key", baseUrl: "https://env.com", id: "env", isEnv: true }),
    ];

    const result = deriveProviderFields(providers, "unknown/model");

    expect(result).toEqual({
      apiKey: "env-key",
      baseURL: "https://env.com",
      model: "model",
      providerType: "anthropic",
    });
  });

  it("falls back to provider with baseUrl when prefix doesn't match", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "test-key", baseUrl: "https://api.test.com", id: "with-url" }),
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
      baseURL: "",
      model: "unknown-model",
      providerType: "anthropic",
    });
  });

  it("returns anthropic defaults when providers array is empty", () => {
    const result = deriveProviderFields([], "any-model");

    expect(result).toEqual({
      apiKey: "",
      baseURL: "",
      model: "any-model",
      providerType: "anthropic",
    });
  });

  it("handles model without prefix by using environment provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "env-key", baseUrl: "https://env.com", id: "env", isEnv: true }),
    ];

    const result = deriveProviderFields(providers, "claude-sonnet-4-5");

    expect(result).toEqual({
      apiKey: "env-key",
      baseURL: "https://env.com",
      model: "claude-sonnet-4-5",
      providerType: "anthropic",
    });
  });

  it("prefers explicit provider match over environment provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "env-key", baseUrl: "https://env.com", id: "env", isEnv: true }),
      createProvider({ apiKey: "explicit-key", baseUrl: "https://explicit.com", id: "explicit" }),
    ];

    const result = deriveProviderFields(providers, "explicit/model");

    expect(result.apiKey).toBe("explicit-key");
    expect(result.baseURL).toBe("https://explicit.com");
  });

  it("handles multiple slashes in model name (uses first segment as provider)", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "first-key", baseUrl: "https://first.com", id: "first" }),
    ];

    const result = deriveProviderFields(providers, "first/model/extra");

    expect(result.model).toBe("model/extra");
    expect(result.apiKey).toBe("first-key");
  });

  it("handles model starting with slash (empty provider ID)", () => {
    const providers: ProviderConfig[] = [
      createProvider({ apiKey: "env-key", id: "env", isEnv: true }),
    ];

    const result = deriveProviderFields(providers, "/model-name");

    expect(result.model).toBe("/model-name");
  });

  it("preserves providerType from matched provider", () => {
    const providers: ProviderConfig[] = [
      createProvider({
        apiKey: "key",
        apiType: "openai-compatible",
        baseUrl: "https://openai.com",
        id: "openai",
      }),
    ];

    const result = deriveProviderFields(providers, "openai/gpt-4");

    expect(result.providerType).toBe("openai-compatible");
  });

  it("returns empty strings for missing credentials", () => {
    const providers: ProviderConfig[] = [createProvider({ apiKey: "", baseUrl: "", id: "empty" })];

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
