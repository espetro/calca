import type { ProviderConfig, ModelInfo, ProviderType } from "../types";

export interface LegacySettings {
  apiKey?: string;
  providerType?: ProviderType;
  baseURL?: string;
  model?: string;
  ideateModel?: string;
  providers?: ProviderConfig[];
}

export interface MigratedSettings {
  providers: ProviderConfig[];
  model?: string;
  ideateModel?: string;
}

/**
 * Migrates legacy single-provider settings to the multi-provider format.
 *
 * Returns:
 * - `null` if already migrated (has a non-empty `providers` array)
 * - `{ providers: [defaultProvider], model: "default/...", ideateModel?: "default/..." }` if legacy flat fields exist with credentials
 * - `{ providers: [] }` if no credentials found
 * - `{ providers: [] }` on any parse/corruption error
 */
export const migrateSettings = (settings: unknown): MigratedSettings | null => {
  try {
    if (!settings || typeof settings !== "object") {
      return { providers: [] };
    }

    const s = settings as Record<string, unknown>;

    if (Array.isArray(s.providers) && s.providers.length > 0) {
      return null;
    }

    const apiKey = typeof s.apiKey === "string" ? s.apiKey : "";
    const baseURL = typeof s.baseURL === "string" ? s.baseURL : "";
    const providerType = s.providerType === "anthropic" || s.providerType === "openai-compatible"
      ? s.providerType
      : "anthropic";
    const model = typeof s.model === "string" ? s.model : "";
    const ideateModel = typeof s.ideateModel === "string" ? s.ideateModel : undefined;

    const hasCredentials = !!apiKey || !!baseURL;

    if (!hasCredentials) {
      return { providers: [] };
    }

    const defaultProvider: ProviderConfig = {
      id: "default",
      apiType: providerType,
      baseUrl: baseURL,
      apiKey,
      models: [],
      lastTested: null,
    };

    const prefixModel = (m: string): string =>
      m.includes("/") ? m : `default/${m}`;

    const result: MigratedSettings = {
      providers: [defaultProvider],
    };

    if (model) {
      result.model = prefixModel(model);
    }
    if (ideateModel) {
      result.ideateModel = prefixModel(ideateModel);
    }

    return result;
  } catch {
    return { providers: [] };
  }
};
