import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ModelMessage } from "ai";
import { buildVariationPrompt, VARIATION_STYLES } from "@app/core/prompts/generate";

export const maxDuration = 300;

const DEFAULT_MODEL = "claude-opus-4-6";

function parseHtmlWithSize(raw: string): { html: string; width?: number; height?: number } {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();

  // Extract size hint: <!--size:WIDTHxHEIGHT-->
  const sizeMatch = cleaned.match(/<!--size:(\d+)x(\d+)-->/);
  let width: number | undefined;
  let height: number | undefined;

  if (sizeMatch) {
    width = parseInt(sizeMatch[1], 10);
    height = parseInt(sizeMatch[2], 10);
    cleaned = cleaned.replace(/<!--size:\d+x\d+-->\n?/, "").trim();
  }

  return { html: cleaned, width, height };
}

async function generateVariation(
  model: string,
  prompt: string,
  style: string,
  index: number,
  systemPrompt?: string,
  apiKey?: string,
): Promise<{ html: string; label: string; width?: number; height?: number }> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildVariationPrompt(prompt, style, systemPrompt),
    },
  ];

  const { result } = await generateWithFallback({
    apiKey,
    model,
    messages,
    maxTokens: 8192,
  });

  const html = result.text;
  const { html: cleaned, width, height } = parseHtmlWithSize(html);

  return {
    html: cleaned,
    label: `Variation ${index + 1}`,
    width,
    height,
  };
}

async function generateSingle(
  model: string,
  originalPrompt: string,
  revision: string,
  existingHtml: string,
  apiKey?: string,
  styleVariation?: string,
  variationIndex?: number,
  systemPrompt?: string,
): Promise<{ html: string; label: string; width?: number; height?: number }> {
  const customInstructions = systemPrompt ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${systemPrompt}\n` : "";
  const styleInstruction = styleVariation
    ? `\n\nStyle direction for THIS variation: ${styleVariation}\nMake this variation feel distinctly different from others while keeping the same concept and revision.`
    : "";

  // Strip base64 images to avoid token explosion
  const imageStore: string[] = [];
  const strippedHtml = existingHtml.replace(/src="(data:image\/[^"]+)"/g, (_m, uri) => {
    const idx = imageStore.length;
    imageStore.push(uri);
    return `src="[IMAGE_PLACEHOLDER_${idx}]"`;
  });
  const restoreImages = (output: string) => {
    let r = output;
    for (let i = 0; i < imageStore.length; i++) r = r.replace(`[IMAGE_PLACEHOLDER_${i}]`, imageStore[i]);
    return r;
  };

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `You are a world-class visual designer. You are EDITING an existing design — not creating a new one.${customInstructions}

Here is the EXISTING HTML design:

${strippedHtml}

Note: [IMAGE_PLACEHOLDER_N] references are real images — keep all <img> tags and their src attributes exactly as-is.

The original request was: "${originalPrompt}"

The user wants this specific change: "${revision}"

CRITICAL RULES:
- Return exactly ONE design — the existing design with ONLY the requested change applied
- Do NOT generate multiple variations, alternatives, or options
- Do NOT stack multiple versions vertically or horizontally
- PRESERVE the existing layout, structure, and content
- ONLY modify what was specifically requested — change nothing else
- Keep the same dimensions

ABSOLUTELY NO MOTION — no CSS animations, transitions, @keyframes, hover effects, or any dynamic behavior. All designs must be completely static.

NO IMAGES — no <img> tags, no url() in CSS. Use CSS gradients, shapes, and pseudo-elements only.

OUTPUT FORMAT:
- Start with <!--size:WIDTHxHEIGHT--> on the first line
- Then the HTML — no explanation, no markdown, no code fences
- Include ALL CSS inline in a <style> tag
- Self-contained, no external dependencies
- Use the same dimensions as the original`,
    },
  ];

  const { result } = await generateWithFallback({
    apiKey,
    model,
    messages,
    maxTokens: 8192,
  });

  const html = result.text;
  const parsed = parseHtmlWithSize(html);
  return {
    html: restoreImages(parsed.html),
    label: variationIndex !== undefined ? `Remix ${variationIndex + 1}` : "Revised",
    width: parsed.width,
    height: parsed.height,
  };
}

export async function handleGenerate(req: NextRequest) {
  try {
    const { prompt, count = 4, revision, existingHtml, apiKey, model, variationIndex, concept, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const useModel = model || DEFAULT_MODEL;

    if (revision && existingHtml) {
      const style = variationIndex !== undefined ? VARIATION_STYLES[variationIndex] || VARIATION_STYLES[0] : undefined;
      const result = await generateSingle(useModel, prompt, revision, existingHtml, apiKey, style, variationIndex, systemPrompt);
      return NextResponse.json({ iteration: result });
    }

    // Single variation mode (sequential generation from frontend)
    if (variationIndex !== undefined) {
      const style = concept || VARIATION_STYLES[variationIndex] || VARIATION_STYLES[0];
      const result = await generateVariation(useModel, prompt, style, variationIndex, systemPrompt, apiKey);
      return NextResponse.json({ iteration: result });
    }

    // Legacy: generate all at once
    const variations = VARIATION_STYLES.slice(0, count);
    const results = await Promise.all(
      variations.map((style, i) => generateVariation(useModel, prompt, style, i, undefined, apiKey))
    );

    return NextResponse.json({ iterations: results });
  } catch (err: unknown) {
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate designs";
    if (message.includes("not_found") || message.includes("404")) {
      return NextResponse.json({ error: "Model not available with this API key. Try a different model in Settings." }, { status: 400 });
    }
    if (message.includes("auth") || message.includes("401") || message.includes("API key")) {
      return NextResponse.json({ error: "Invalid API key. Check your key in Settings." }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
