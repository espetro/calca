import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/shared/ai/client";
import type { ModelMessage } from "ai";

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
      content: `You are a design critic. Analyze this HTML/CSS design and provide specific, actionable feedback for improving the NEXT variation.

Original request: "${prompt}"

HTML:
${stripped}

Provide 3-5 bullet points of specific improvements. Focus on:
- What works well (keep this in the next variation)
- What could be better (typography, spacing, color, layout)
- A different creative direction to try

Be specific and concise. This feedback will be injected into the next generation prompt.`,
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
