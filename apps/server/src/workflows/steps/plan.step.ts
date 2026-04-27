import { createStep } from "@mastra/core/workflows";
import { generateWithFallback } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import type { ModelMessage } from "ai";
import { buildPlanPrompt } from "@app/core/prompts/plan";
import { PlanInputSchema, PlanOutputSchema } from "../schemas/plan.schema";
import { getLogger } from "@app/logger";

const DEFAULT_MODEL = "claude-opus-4-6";

const logger = getLogger(["calca", "server", "workflow", "plan"]);

const VARIATION_STYLES = [
  { direction: "Clean lines, generous whitespace, restrained color palette", name: "Minimal" },
  { direction: "High contrast, striking typography, confident composition", name: "Bold" },
  { direction: "Soft shapes, warm tones, natural textures", name: "Organic" },
];

export const planStep = createStep({
  execute: async ({ inputData }) => {
    const { prompt, model, apiKey, baseURL, providerType } = inputData;
    const useModel = model || DEFAULT_MODEL;

    const messages: ModelMessage[] = [
      {
        content: buildPlanPrompt(prompt),
        role: "user",
      },
    ];

    try {
      const { result } = await generateWithFallback({
        apiKey,
        baseURL,
        maxTokens: 2048,
        messages,
        model: useModel,
        providerType: providerType as ProviderType | undefined,
      });

      const raw = result.text;

      // Try to parse as JSON array of concepts
      let concepts: { name: string; direction: string }[];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          concepts = parsed.map((c: { name?: string; direction?: string }) => ({
            direction: c.direction || "",
            name: c.name || "Variation",
          }));
        } else if (parsed.concepts && Array.isArray(parsed.concepts)) {
          concepts = parsed.concepts.map((c: { name?: string; direction?: string }) => ({
            direction: c.direction || "",
            name: c.name || "Variation",
          }));
        } else {
          throw new Error("Unexpected plan response format");
        }
      } catch {
        // Fallback: try to extract concepts from text
        const lines = raw.split("\n").filter((l) => l.trim());
        concepts = lines.slice(0, 3).map((line, i) => ({
          direction: line.split(":")[1]?.trim() || line.trim(),
          name: line.split(":")[0]?.trim() || `Variation ${i + 1}`,
        }));
      }

      if (concepts.length === 0) {
        throw new Error("No concepts generated");
      }

      return {
        concepts,
        count: concepts.length,
      };
    } catch (error) {
      logger.warn("Plan generation failed, using fallback:", { error });
      return {
        concepts: VARIATION_STYLES,
        count: VARIATION_STYLES.length,
      };
    }
  },
  id: "plan",
  inputSchema: PlanInputSchema,
  outputSchema: PlanOutputSchema,
});
