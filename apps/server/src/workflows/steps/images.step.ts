import { createStep } from "@mastra/core/workflows";

import { generateImages } from "@app/core/pipeline/images";
import { getLogger } from "@app/logger";

import { ImagesInputSchema, ImagesOutputSchema } from "../schemas/images.schema";

const logger = getLogger(["calca", "server", "workflow", "images"]);

export const imagesStep = createStep({
  execute: async ({ inputData, writer, abortSignal }) => {
    const { html, geminiKey, unsplashKey, openaiKey, viewport } = inputData;

    if (!geminiKey && !unsplashKey && !openaiKey) {
      writer.write({
        message: "No image API keys provided - skipping image generation",
        stage: "images",
        type: "progress",
      });
      return { html };
    }

    writer.write({
      message: "Starting image generation...",
      stage: "images",
      type: "progress",
    });

    try {
      const result = await generateImages({
        geminiKey,
        html,
        openaiKey,
        unsplashKey,
        viewport,
      });

      if (result.imageCount > 0) {
        writer.write({
          current: result.imageCount,
          message: `Generated ${result.imageCount} image(s)`,
          stage: "images",
          total: result.imageCount,
          type: "progress",
        });
      }

      if (result.skipped) {
        writer.write({
          message: result.reason || "Image generation skipped",
          stage: "images",
          type: "progress",
        });
      }

      return { html: result.html };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[Images Step] Generation failed:\n${error.message}`);
      } else {
        logger.error(`[Images Step] Generation failed:`, { error });
      }

      writer.write({
        message: "Image generation failed - returning HTML unchanged",
        stage: "images",
        type: "progress",
      });

      return { html };
    }
  },
  id: "images",
  inputSchema: ImagesInputSchema,
  outputSchema: ImagesOutputSchema,
});
