import { anthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ImageModelV3, LanguageModelV3 } from "@ai-sdk/provider";

export type ProviderType = "anthropic" | "openai-compatible";

type CallableProvider = {
  (modelId: string): LanguageModelV3;
};

export function getAIProvider(
  providerType: ProviderType,
  apiKey?: string,
  baseURL?: string,
): CallableProvider {
  switch (providerType) {
    case "anthropic":
      return anthropic;
    case "openai-compatible":
      return createOpenAICompatible({
        name: "openai-compatible",
        apiKey,
        baseURL: baseURL ?? "",
        supportsStructuredOutputs: true,
      });
  }
}

/** @deprecated fetch models from cache otherwise API (use API base url + key). Keep single 'getModel' method. This is currently in apps/web, we must migrate it to apps/server */
export function getClaudeModel(modelId: string) {
  return modelId;
}

/** @deprecated fetch models from cache otherwise API (use API base url + key). Keep single 'getModel' method. This is currently in apps/web, we must migrate it to apps/server */
export function getGeminiModel(modelId: string) {
  return modelId;
}

export function buildModelFallbackChain(preferredModel: string, fallbackModel?: string): string[] {
  const chain: string[] = [preferredModel];
  if (fallbackModel && fallbackModel !== preferredModel) {
    chain.push(fallbackModel);
  }
  return chain;
}

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

/** @deprecated fetch models from cache otherwise API (use API base url + key). Keep single 'getModel' method. This is currently in apps/web, we must migrate it to apps/server */
export function getGeminiImageModel(apiKey?: string): ImageModelV3 {
  const provider = apiKey ? createGoogleGenerativeAI({ apiKey }) : google;
  return provider.image(GEMINI_IMAGE_MODEL);
}
