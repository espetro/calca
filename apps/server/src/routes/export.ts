import { Hono, type Context } from "hono";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { htmlToSvg } from "../lib/html-to-svg";
import { TAILWIND_PROMPT, REACT_PROMPT } from "../lib/export-prompts";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

async function convertWithAI(
  apiKey: string | undefined,
  model: string,
  html: string,
  systemPrompt: string,
  providerType?: ProviderType,
  baseURL?: string,
): Promise<string> {
  const { result } = await generateWithFallback({
    apiKey,
    model,
    messages: [
      { role: "user", content: `${systemPrompt}\n\nHere is the HTML/CSS to convert:\n\n${html}` },
    ],
    maxTokens: 4096,
    providerType: providerType as ProviderType | undefined,
    baseURL,
  });

  let resultText = result.text.trim();
  if (resultText.startsWith("```")) {
    resultText = resultText
      .replace(/^```(?:html|tsx|jsx|typescript)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  return resultText.trim();
}

export async function handleExport(c: Context) {
  try {
    const { html: rawHtml, format, apiKey, model, providerType, baseURL } = await c.req.json();

    if (!rawHtml || !format) {
      return c.json({ error: "html and format required" }, 400);
    }

    // Strip base64 images to reduce payload size for AI conversion
    const html = rawHtml.replace(/src="data:image\/[^"]+"/g, 'src="[image]"');

    const useModel = model || DEFAULT_MODEL;

    switch (format) {
      case "svg":
        return c.json({ result: htmlToSvg(html) });

      case "tailwind":
        return c.json({
          result: await convertWithAI(
            apiKey,
            useModel,
            html,
            TAILWIND_PROMPT,
            providerType as ProviderType | undefined,
            baseURL,
          ),
        });

      case "react":
        return c.json({
          result: await convertWithAI(
            apiKey,
            useModel,
            html,
            REACT_PROMPT,
            providerType as ProviderType | undefined,
            baseURL,
          ),
        });

      default:
        return c.json({ error: "Invalid format" }, 400);
    }
  } catch (err: unknown) {
    console.error("Export error:", err);
    const message = err instanceof Error ? err.message : "Export failed";
    const status = message.includes("auth") || message.includes("API key") ? 401 : 500;
    return c.json({ error: message }, status);
  }
}

const route = new Hono().post("/", handleExport);

export default route;
