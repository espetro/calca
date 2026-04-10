import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@app/core/ai/client";
import type { ModelMessage } from "ai";
import { buildPlanPrompt } from "@app/core/prompts/plan";

export const maxDuration = 30;

export async function handlePlan(req: NextRequest) {
  try {
    const { prompt, apiKey, model } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const messages: ModelMessage[] = [
      {
        role: "user",
        content: buildPlanPrompt(prompt),
      },
    ];

    const { result } = await generateWithFallback({
      apiKey,
      model: model || "claude-sonnet-4-5-20250514",
      messages,
      maxTokens: 300,
    });

    const text = result.text;
    
    try {
      // Extract JSON from response (handle markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        const count = Math.min(Math.max(Number(plan.count) || 4, 2), 6);
        const concepts = (plan.concepts || []).slice(0, count);
        return NextResponse.json({ count, concepts });
      }
    } catch {}

    // Fallback
    return NextResponse.json({ count: 4, concepts: [] });
  } catch (err) {
    console.error("Plan error:", err);
    // Fallback on any error — don't block generation
    return NextResponse.json({ count: 4, concepts: [] });
  }
}
