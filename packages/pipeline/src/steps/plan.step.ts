import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildPlanPrompt } from "@app/core/prompts/plan";
import { stripReasoningBlocks } from "@app/shared";
import { type ModelMessage, Output } from "ai";
import { z } from "zod";

import { ConceptSchema } from "../types";
import type { PlanInput, PlanOutput, Step, StepContext } from "../types";

const PlanConceptsSchema = z.object({ concepts: z.array(ConceptSchema) });

const VARIATION_STYLES = [
  { name: "Minimal", direction: "Clean lines, generous whitespace, restrained color palette" },
  { name: "Bold", direction: "High contrast, striking typography, confident composition" },
  { name: "Organic", direction: "Soft shapes, warm tones, natural textures" },
];

/** The client pre-creates `conceptCount` frame slots — pad or trim so the plan
 * always returns exactly that many concepts and no slot is left pending. */
function normalizeCount(
  concepts: Array<{ name: string; direction: string }>,
  conceptCount: number | undefined,
): Array<{ name: string; direction: string }> {
  if (!conceptCount || conceptCount <= 0) {
    return concepts;
  }
  const trimmed = concepts.slice(0, conceptCount);
  while (trimmed.length < conceptCount) {
    trimmed.push(VARIATION_STYLES[trimmed.length % VARIATION_STYLES.length]!);
  }
  return trimmed;
}

export const planStep: Step<PlanInput, PlanOutput> = async (input, ctx: StepContext) => {
  const { prompt, conceptCount, model, apiKey, baseURL, providerType } = input;
  const useModel = model;

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildPlanPrompt(prompt),
    },
  ];

  try {
    const { result } = await generateWithFallback({
      apiKey,
      model: useModel,
      messages,
      maxTokens: 2048,
      providerType: providerType as ProviderType | undefined,
      baseURL,
      functionId: "plan",
      output: Output.object({ schema: PlanConceptsSchema }),
      onFinish: (event) => ctx.tokenUsage?.add(event.usage),
    });

    let concepts: Array<{ name: string; direction: string }> | undefined;
    try {
      concepts = PlanConceptsSchema.parse(result.output).concepts;
    } catch {
      // Provider ignored the structured-output spec — parse the raw text below.
    }

    if (!concepts) {
      const raw = stripReasoningBlocks(result.text ?? "");
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          concepts = parsed.map((c: { name?: string; direction?: string }) => ({
            name: c.name || "Variation",
            direction: c.direction || "",
          }));
        } else if (parsed.concepts && Array.isArray(parsed.concepts)) {
          concepts = parsed.concepts.map((c: string | { name?: string; direction?: string }) => ({
            name: typeof c === "string" ? c : c.name || "Variation",
            direction: typeof c === "string" ? "" : c.direction || "",
          }));
        } else {
          throw new Error("Unexpected plan response format");
        }
      } catch {
        const lines = raw.split("\n").filter((l) => l.trim());
        concepts = lines.slice(0, conceptCount || 3).map((line, i) => ({
          name: line.split(":")[0]?.trim() || `Variation ${i + 1}`,
          direction: line.split(":")[1]?.trim() || line.trim(),
        }));
      }
    }

    concepts = normalizeCount(concepts ?? VARIATION_STYLES, conceptCount);

    if (concepts.length === 0) {
      throw new Error("No concepts generated");
    }

    return {
      count: concepts.length,
      concepts,
    };
  } catch (error) {
    ctx.logger.warn("Plan generation failed, using fallback:", { error });
    return {
      count: normalizeCount(VARIATION_STYLES, conceptCount).length,
      concepts: normalizeCount(VARIATION_STYLES, conceptCount),
    };
  }
};
