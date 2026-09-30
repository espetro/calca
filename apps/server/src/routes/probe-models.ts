import { probeModels } from "@app/core/ai/probe";
import type { ProviderType } from "@app/core/ai/providers";
import { getLogger } from "@app/logger";
import { type Context, Hono, type TypedResponse } from "hono";

const logger = getLogger(["calca", "server", "routes", "probe"]);

type ProbeModelsResponse =
  | TypedResponse<{ error: string }>
  | TypedResponse<{ available: Record<string, boolean> }>;

export async function handleProbeModels(c: Context): Promise<Response & ProbeModelsResponse> {
  try {
    const { apiKey, providerType, baseURL } = (await c.req.json()) as {
      apiKey?: string;
      providerType?: ProviderType;
      baseURL?: string;
    };

    if (providerType === "anthropic" && !apiKey) {
      return c.json({ error: "apiKey required" }, 401);
    }

    const available = await probeModels(apiKey ?? "", baseURL, providerType);
    return c.json({ available });
  } catch (error) {
    logger.error("Probe error:", { error });
    return c.json({ error: "Probe failed" }, 500);
  }
}

const route = new Hono()
  //
  .post("/", handleProbeModels);

export default route;
