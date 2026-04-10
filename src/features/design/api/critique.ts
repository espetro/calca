import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ModelMessage } from "ai";
import { buildCritiquePrompt } from "@app/core/prompts/critique";

export const maxDuration = 30;

const DEFAULT_MODEL = "claude-opus-4-6";

function stripBase64Images(html: string): string {
  return html.replace(/src="(data:image\/[^"]+)"/g, (_match, _dataUri) => {
    return `src="[IMAGE]"`;
  });
}

export async function handleCritique(req: NextRequest) {
  try {
    const { html, prompt, model, apiKey } = await req.json();
    const useModel = model || DEFAULT_MODEL;

    const stripped = stripBase64Images(html);

    const messages: ModelMessage[] = [{
      role: "user",
      content: buildCritiquePrompt(prompt, stripped),
    }];

    const { result } = await generateWithFallback({
      apiKey,
      model: useModel,
      messages,
      maxTokens: 1024,
    });

    const critique = result.text;
    return NextResponse.json({ critique });
  } catch (err) {
    console.error("Critique error:", err);
    return NextResponse.json({ critique: "" });
  }
}
