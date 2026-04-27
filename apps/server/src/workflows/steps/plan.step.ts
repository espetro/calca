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
  { name: "Minimal", direction: "Clean lines, generous whitespace, restrained color palette" },
  { name: "Bold", direction: "High contrast, striking typography, confident composition" },
  { name: "Organic", direction: "Soft shapes, warm tones, natural textures" },
];

export const planStep = createStep({
  id: "plan",
  inputSchema: PlanInputSchema,
  outputSchema: PlanOutputSchema,
  execute: async ({ inputData }) => {
    const { prompt, model, apiKey, baseURL, providerType } = inputData;
    const useModel = model || DEFAULT_MODEL;

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
      });

      const raw = result.text;

      // Try to parse as JSON array of concepts
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
        // Fallback: try to extract concepts from text
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
      logger.warn("Plan generation failed, using fallback:", { error });
      return {
        count: VARIATION_STYLES.length,
        concepts: VARIATION_STYLES,
      };
    }
  },
});
