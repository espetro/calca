import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildCritiquePrompt } from "@app/core/prompts/critique";
import { validateCritique } from "@app/shared";
import { stripBase64Images } from "../lib/strip-base64";

export const maxDuration = 30;

const DEFAULT_MODEL = "claude-opus-4-6";

export async function handleCritique(req: NextRequest) {
  try {
    const { html, prompt, model, apiKey, providerType, baseURL } = await req.json();
    const useModel = model || DEFAULT_MODEL;

    const { stripped } = stripBase64Images(html);

    const messages: ModelMessage[] = [{
      role: "user",
      content: buildCritiquePrompt(prompt, stripped),
    }];

    const { result } = await generateWithFallback({
      apiKey,
      model: useModel,
      messages,
      maxTokens: 1024,
      providerType: providerType as ProviderType | undefined,
      baseURL,
    });

    const raw = result.text;
    try {
      const validated = validateCritique(raw);
      return NextResponse.json({ critique: validated });
    } catch (validationErr) {
      console.warn("Critique validation failed, returning raw output:", validationErr);
      return NextResponse.json({ critique: raw });
    }
  } catch (err) {
    console.error("Critique error:", err);
    return NextResponse.json({ critique: "" });
  }
}
