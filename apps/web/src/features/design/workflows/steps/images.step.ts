import { createStep } from "@mastra/core/workflows";

import { generateImages } from "@app/core/pipeline/images";

import { ImagesInputSchema, ImagesOutputSchema } from "../schemas/images.schema";

export const imagesStep = createStep({
  id: "images",
  inputSchema: ImagesInputSchema,
  outputSchema: ImagesOutputSchema,
  execute: async ({ inputData, writer, abortSignal }) => {
    const { html, geminiKey, unsplashKey, openaiKey, viewport } = inputData;

    if (!geminiKey && !unsplashKey && !openaiKey) {
      writer.write({
        type: "progress",
        stage: "images",
        message: "No image API keys provided - skipping image generation",
      });
      return { html };
    }

    writer.write({
      type: "progress",
      stage: "images",
      message: "Starting image generation...",
    });

    try {
      const result = await generateImages({
        html,
        geminiKey,
        unsplashKey,
        openaiKey,
        viewport,
      });

      if (result.imageCount > 0) {
        writer.write({
          type: "progress",
          stage: "images",
          current: result.imageCount,
          total: result.imageCount,
          message: `Generated ${result.imageCount} image(s)`,
        });
      }

      if (result.skipped) {
        writer.write({
          type: "progress",
          stage: "images",
          message: result.reason || "Image generation skipped",
        });
      }

      return { html: result.html };
    } catch (error) {
      console.error("[Images Step] Generation failed:", error instanceof Error ? error.message : error);
      
      writer.write({
        type: "progress",
        stage: "images",
        message: "Image generation failed - returning HTML unchanged",
      });
      
      return { html };
    }
  },
});
