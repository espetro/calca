import { describe, it, expect } from "vitest";
import { migrateSettings, type LegacySettings, type MigratedSettings } from "./migrate-settings";

describe("migrateSettings", () => {
  it("returns null when settings already migrated (has providers array)", () => {
    const settings = {
      providers: [
        {
          id: "default",
          apiType: "anthropic" as const,
          baseUrl: "https://api.anthropic.com",
          apiKey: "test-key",
          models: [],
          lastTested: null,
        },
      ],
    };

    const result = migrateSettings(settings);
    expect(result).toBeNull();
  });

  it("returns empty providers when settings is null", () => {
    const result = migrateSettings(null);
    expect(result).toEqual({ providers: [] });
  });

  it("returns empty providers when settings is undefined", () => {
    const result = migrateSettings(undefined);
    expect(result).toEqual({ providers: [] });
  });

  it("returns empty providers when settings is not an object", () => {
    expect(migrateSettings("string")).toEqual({ providers: [] });
    expect(migrateSettings(123)).toEqual({ providers: [] });
    expect(migrateSettings([])).toEqual({ providers: [] });
  });

  it("migrates legacy settings with apiKey to new format", () => {
    const legacy: LegacySettings = {
      apiKey: "test-api-key",
      providerType: "anthropic",
      baseURL: "https://api.anthropic.com",
      model: "claude-sonnet-4-5",
    };

    const result = migrateSettings(legacy);

    expect(result).not.toBeNull();
    expect(result?.providers).toHaveLength(1);
    expect(result?.providers[0]).toEqual({
      id: "default",
      apiType: "anthropic",
      baseUrl: "https://api.anthropic.com",
      apiKey: "test-api-key",
      models: [],
      lastTested: null,
    });
    expect(result?.model).toBe("default/claude-sonnet-4-5");
  });

  it("migrates legacy settings without model (no model in result)", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "https://api.example.com",
    };

    const result = migrateSettings(legacy);

    expect(result).not.toBeNull();
    expect(result?.providers).toHaveLength(1);
    expect(result?.model).toBeUndefined();
  });

  it("migrates legacy settings with ideateModel", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "",
      ideateModel: "gpt-4",
    };

    const result = migrateSettings(legacy);

    expect(result).not.toBeNull();
    expect(result?.ideateModel).toBe("default/gpt-4");
  });

  it("prefixes model with provider-id if not already prefixed", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "",
      model: "claude-3",
    };

    const result = migrateSettings(legacy);
    expect(result?.model).toBe("default/claude-3");
  });

  it("preserves already prefixed model names", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "",
      model: "custom-provider/model-name",
    };

    const result = migrateSettings(legacy);
    expect(result?.model).toBe("custom-provider/model-name");
  });

  it("defaults providerType to anthropic when invalid", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "",
      providerType: "invalid" as any,
    };

    const result = migrateSettings(legacy);
    expect(result?.providers[0].apiType).toBe("anthropic");
  });

  it("accepts valid openai-compatible providerType", () => {
    const legacy: LegacySettings = {
      apiKey: "test-key",
      baseURL: "https://api.openai.com",
      providerType: "openai-compatible",
    };

    const result = migrateSettings(legacy);
    expect(result?.providers[0].apiType).toBe("openai-compatible");
  });

  it("returns empty providers when no credentials provided", () => {
    const legacy: LegacySettings = {
      providerType: "anthropic",
      model: "claude-3",
    };

    const result = migrateSettings(legacy);
    expect(result).toEqual({ providers: [] });
  });

  it("returns empty providers on parse error (corrupted settings)", () => {
    const corrupted = Object.create(null);
    (corrupted as any).apiKey = { invalid: "object" };

    const result = migrateSettings(corrupted);
    expect(result).toEqual({ providers: [] });
  });

  it("handles empty string apiKey as no credentials", () => {
    const legacy: LegacySettings = {
      apiKey: "",
      baseURL: "",
    };

    const result = migrateSettings(legacy);
    expect(result).toEqual({ providers: [] });
  });

  it("migrates settings with only baseURL (has credentials)", () => {
    const legacy: LegacySettings = {
      baseURL: "https://api.example.com",
      model: "test-model",
    };

    const result = migrateSettings(legacy);
    expect(result).not.toBeNull();
    expect(result?.providers).toHaveLength(1);
    expect(result?.providers[0].baseUrl).toBe("https://api.example.com");
  });

  it("returns empty providers when providers array is empty (treated as not migrated)", () => {
    const settings = {
      providers: [],
      model: "test",
    };

    const result = migrateSettings(settings);
    expect(result).toEqual({ providers: [] });
  });
});
