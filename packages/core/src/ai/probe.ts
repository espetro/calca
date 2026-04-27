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
        model: getClaudeModel(model),
        maxOutputTokens: 1,
        messages: [{ role: "user", content: "hi" }],
        headers,
      });
      available[model] = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn("OpenAI-compatible /models endpoint returned 404");
        return {};
      }
      logger.info(`OpenAI-compatible /models returned status ${response.status}`);
      return {};
    }

    const data = (await response.json()) as { data?: Array<{ id: string }> };
    const models = data.data ?? [];
    const available: Record<string, boolean> = {};

    for (const model of models) {
      available[model.id] = true;
    }

    return available;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`OpenAI-compatible probe error: ${msg}`);
    return {};
  }
}
