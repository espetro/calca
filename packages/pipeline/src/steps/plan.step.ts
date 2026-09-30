import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildPlanPrompt } from "@app/core/prompts/plan";
import type { ModelMessage } from "ai";

import type { PlanInput, PlanOutput, Step, StepContext } from "../types";

const VARIATION_STYLES = [
  { name: "Minimal", direction: "Clean lines, generous whitespace, restrained color palette" },
  { name: "Bold", direction: "High contrast, striking typography, confident composition" },
  { name: "Organic", direction: "Soft shapes, warm tones, natural textures" },
];

export const planStep: Step<PlanInput, PlanOutput> = async (input, ctx: StepContext) => {
  const { prompt, model, apiKey, baseURL, providerType } = input;
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
      onFinish: (event) => ctx.tokenUsage?.add(event.usage),
    });

    const raw = result.text;

    let concepts: Array<{ name: string; direction: string }>;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        concepts = parsed.map((c: { name?: string; direction?: string }) => ({
          name: c.name || "Variation",
          direction: c.direction || "",
        }));
      } else if (parsed.concepts && Array.isArray(parsed.concepts)) {
        concepts = parsed.concepts.map((c: { name?: string; direction?: string }) => ({
          name: c.name || "Variation",
          direction: c.direction || "",
        }));
      } else {
        throw new Error("Unexpected plan response format");
      }
    } catch {
      const lines = raw.split("\n").filter((l) => l.trim());
      concepts = lines.slice(0, 3).map((line, i) => ({
        name: line.split(":")[0]?.trim() || `Variation ${i + 1}`,
        direction: line.split(":")[1]?.trim() || line.trim(),
      }));
    }

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
      count: VARIATION_STYLES.length,
      concepts: VARIATION_STYLES,
    };
  }
};
