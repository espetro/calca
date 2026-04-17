import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildReviewPrompt } from "@app/core/prompts/review";
import { validateReview } from "@app/shared";
import { parseHtmlWithSize } from "../lib/parse-html";
import { stripBase64Images } from "../lib/strip-base64";

export const maxDuration = 300;

const DEFAULT_MODEL = "claude-opus-4-6";

export async function handleReview(req: NextRequest) {
  try {
    const { html, prompt, width, height, model, apiKey, providerType, baseURL } = await req.json();
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
      providerType: providerType as ProviderType | undefined,
      baseURL,
    });

    const raw = result.text;
    try {
      const validated = validateReview(raw);
      return NextResponse.json({ html: restore(validated.html), width: validated.width || width, height: validated.height || height });
    } catch (validationErr) {
      console.warn("Review validation failed, returning raw output:", validationErr);
      const parsed = parseHtmlWithSize(raw);
      return NextResponse.json({ html: restore(parsed.html), width: parsed.width || width, height: parsed.height || height });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Review failed";
    console.error("Review error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
