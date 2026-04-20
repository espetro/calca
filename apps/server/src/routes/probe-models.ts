import { Hono } from "hono";
import { probeModels } from "@app/core/ai/probe";
import type { ProviderType } from "@app/core/ai/providers";

const route = new Hono()
  //
  .post("/", async (c) => {
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
    } catch (err) {
      console.error("Probe error:", err);
      return c.json({ error: "Probe failed" }, 500);
    }
  });

export default route;
