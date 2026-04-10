import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ModelMessage } from "ai";
import { buildReviewPrompt } from "@app/core/prompts/review";

export const maxDuration = 300;

const DEFAULT_MODEL = "claude-opus-4-6";

function stripBase64Images(html: string): { stripped: string; restore: (output: string) => string } {
  const images: string[] = [];
  const stripped = html.replace(/src="(data:image\/[^"]+)"/g, (_match, dataUri) => {
    const idx = images.length;
    images.push(dataUri);
    return `src="[IMAGE_PLACEHOLDER_${idx}]"`;
  });
  const restore = (output: string): string => {
    let result = output;
    for (let i = 0; i < images.length; i++) {
      result = result.replace(`[IMAGE_PLACEHOLDER_${i}]`, images[i]);
    }
    return result;
  };
  return { stripped, restore };
}

function parseHtmlWithSize(raw: string): { html: string; width?: number; height?: number } {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  const fenceMatch = cleaned.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1];
  cleaned = cleaned.trim();
  const sizeMatch = cleaned.match(/<!--size:(\d+)x(\d+)-->/);
  let width: number | undefined, height: number | undefined;
  if (sizeMatch) {
    width = parseInt(sizeMatch[1], 10);
    height = parseInt(sizeMatch[2], 10);
    cleaned = cleaned.replace(/<!--size:\d+x\d+-->\n?/, "").trim();
  }
  const htmlStart = cleaned.match(/^[\s\S]*?(<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s])/i);
  if (htmlStart && htmlStart.index !== undefined && htmlStart.index > 0) cleaned = cleaned.substring(htmlStart.index);
  const lastTagMatch = cleaned.match(/([\s\S]*<\/(?:html|div|section|main|body)>)/i);
  if (lastTagMatch) cleaned = lastTagMatch[1];
  return { html: cleaned.trim(), width, height };
}

export async function handleReview(req: NextRequest) {
  try {
    const { html, prompt, width, height, model, apiKey } = await req.json();
    const useModel = model || DEFAULT_MODEL;

    const { stripped, restore } = stripBase64Images(html);

    const messages: ModelMessage[] = [{
      role: "user",
      content: buildReviewPrompt(prompt, width, height, stripped),
    }];

    const { result } = await generateWithFallback({
      apiKey,
      model: useModel,
      messages,
      maxTokens: 16384,
    });

    const raw = result.text;
    const parsed = parseHtmlWithSize(raw);
    return NextResponse.json({ html: restore(parsed.html), width: parsed.width || width, height: parsed.height || height });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Review failed";
    console.error("Review error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
