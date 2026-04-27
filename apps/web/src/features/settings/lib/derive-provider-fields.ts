import type { ProviderConfig, ProviderType } from "../types";

export interface DerivedProviderFields {
  apiKey: string;
  providerType: ProviderType;
  baseURL: string;
  model: string;
}

/**
 * Given a list of provider configs and a model string (possibly prefixed
 * with `"provider-id/"`), extract the concrete fields needed for an API call.
 *
 * - If the model contains a `/` prefix that matches a provider, use that provider's
 *   credentials and base URL.
 * - Otherwise fall back to safe defaults (empty strings, `"anthropic"`).
 * - Never throws — callers always get a usable result.
 */
export const deriveProviderFields = (
  providers: ProviderConfig[],
  model: string,
): DerivedProviderFields => {
  const slashIndex = model.indexOf("/");
  if (slashIndex > 0) {
    const providerId = model.slice(0, slashIndex);
    const modelId = model.slice(slashIndex + 1);
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      return {
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl,
        model: modelId,
        providerType: provider.apiType,
      };
    }
    // Fallback to environment provider if available
    const envProvider = providers.find((p) => p.isEnv || p.baseUrl);
    if (envProvider) {
      return {
        apiKey: envProvider.apiKey,
        baseURL: envProvider.baseUrl,
        model: modelId,
        providerType: envProvider.apiType,
      };
    }
    // Last resort: anthropic
    return {
      apiKey: "",
      baseURL: "",
      model: modelId,
      providerType: "anthropic",
    };
  }

  // Fallback to environment provider if available
  const envProvider = providers.find((p) => p.isEnv || p.baseUrl);
  if (envProvider) {
    return {
      apiKey: envProvider.apiKey,
      baseURL: envProvider.baseUrl,
      model,
      providerType: envProvider.apiType,
    };
  }
  // Last resort: anthropic
  return {
    apiKey: "",
    baseURL: "",
    model,
    providerType: "anthropic",
  };
};
