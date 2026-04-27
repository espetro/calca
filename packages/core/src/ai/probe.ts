import { generateText } from "ai";
import { getClaudeModel } from "./providers";
import type { ProviderType } from "./providers";
import { getLogger } from "@app/logger";

const logger = getLogger(["calca", "core", "ai", "probe"]);

export interface ModelInfo {
  id: string;
  available: boolean;
}

export async function probeModels(
  apiKey: string,
  baseURL?: string,
  providerType?: ProviderType,
  preferredModel?: string,
  fallbackModel?: string,
): Promise<Record<string, boolean>> {
  if (providerType === "openai-compatible") {
    return probeOpenAICompatibleModels(apiKey, baseURL);
  }
  return probeAnthropicModels(apiKey, preferredModel, fallbackModel);
}

async function probeAnthropicModels(
  apiKey: string,
  preferredModel?: string,
  fallbackModel?: string,
): Promise<Record<string, boolean>> {
  const headers: Record<string, string> = { "x-anthropic-key": apiKey };
  const available: Record<string, boolean> = {};

  const modelsToProbe = [preferredModel, fallbackModel].filter(Boolean) as string[];

  if (modelsToProbe.length === 0) {
    return {};
  }

  for (const model of modelsToProbe) {
    try {
      await generateText({
        headers,
        maxOutputTokens: 1,
        messages: [{ content: "hi", role: "user" }],
        model: getClaudeModel(model),
      });
      available[model] = true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.debug(`Probe ${model}: ${msg}`);
      available[model] = true;
    }
  }

  return available;
}

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
