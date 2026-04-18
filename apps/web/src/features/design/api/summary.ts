import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildSummaryPrompt } from "@app/core/prompts/summary";
import { validateSummary } from "@app/shared";
import { stripBase64Images } from "../lib/strip-base64";

export const maxDuration = 30;

const DEFAULT_MODEL = "claude-opus-4-6";

export async function handleSummary(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.html || !body.prompt) {
      return NextResponse.json(
        { error: "Missing required fields: html, prompt" },
        { status: 400 }
      );
    }
    const { html, prompt, labels, model, apiKey, providerType, baseURL } = body;
    const useModel = model || DEFAULT_MODEL;

    const { stripped } = stripBase64Images(html);

    const messages: ModelMessage[] = [{
      role: "user",
      content: buildSummaryPrompt(prompt, stripped, labels),
    }];

    const { result } = await generateWithFallback({
      apiKey,
      model: useModel,
      messages,
      maxTokens: 512,
      providerType: providerType as ProviderType | undefined,
      baseURL,
    });

    const raw = result.text;
    try {
      const parsed = JSON.parse(raw);
      const validated = validateSummary(parsed);
      return NextResponse.json({ summary: validated });
    } catch (validationErr) {
      console.warn("Summary validation failed:", validationErr);
      return NextResponse.json({ summary: undefined });
    }
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ summary: undefined });
  }
}
