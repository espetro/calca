import { getLogger } from "@app/logger";
import { CallSettings, generateText, LanguageModel } from "ai";

import { getClaudeModel } from "./providers";
import type { ProviderType } from "./providers";

const logger = getLogger(["calca", "core", "ai", "probe"]);

export interface ModelInfo {
  id: string;
  available: boolean;
}

const probeModel = async (model: LanguageModel, settings: CallSettings) =>
  await generateText({
    ...settings,
    model,
    maxOutputTokens: 1,
    messages: [{ content: "hi", role: "user" }],
  });

const probeAnthropicModels = async (
  apiKey: string,
  preferredModel?: string,
  fallbackModel?: string,
) => {
  const headers = { "x-anthropic-key": apiKey };
  const available: Record<string, boolean> = {};

  const modelsToProbe = [preferredModel, fallbackModel].filter(Boolean) as string[];

  if (modelsToProbe.length === 0) {
    return {};
  }

  for (const model of modelsToProbe) {
    try {
      await probeModel(getClaudeModel(model), { headers });
      available[model] = true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.debug(`Probe ${model}: ${msg}`);
      available[model] = true;
    }
  }

  return available;
};

export const probeModels = async (
  apiKey: string,
  baseURL?: string,
  providerType?: ProviderType,
  preferredModel?: string,
  fallbackModel?: string,
) =>
  providerType === "openai-compatible"
    ? probeOpenAICompatibleModels(apiKey, baseURL)
    : probeAnthropicModels(apiKey, preferredModel, fallbackModel);

async function probeOpenAICompatibleModels(
  apiKey: string,
  baseURL?: string,
): Promise<Record<string, boolean>> {
  const baseUrl = baseURL?.replace(/\/+$/, "") ?? "";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const response = await fetch(`${baseUrl}/models`, {
      headers,
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn("OpenAI-compatible /models endpoint returned 404");
        return {};
      }
      logger.info(`OpenAI-compatible /models returned status ${response.status}`);
      return {};
    }

    const data = (await response.json()) as { data?: { id: string }[] };
    const models = data.data ?? [];
    const available: Record<string, boolean> = {};

    for (const model of models) {
      available[model.id] = true;
    }

    return available;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`OpenAI-compatible probe error: ${msg}`);
    return {};
  }
}
