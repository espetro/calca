import { generateImages } from "@app/core/pipeline/images";

import type { ImagesInput, ImagesOutput, Step, StepContext } from "../types";

export const imagesStep: Step<ImagesInput, ImagesOutput> = async (input, ctx: StepContext) => {
  const { html, geminiKey, unsplashKey, openaiKey, viewport } = input;

  if (!geminiKey && !unsplashKey && !openaiKey) {
    ctx.emit({ type: "step", step: "images", status: "running", frameIndex: undefined });
    return { html };
  }

  ctx.emit({ type: "step", step: "images", status: "running", frameIndex: undefined });

  try {
    const result = await generateImages({
      geminiKey,
      html,
      openaiKey,
      unsplashKey,
      viewport,
    });

    if (result.imageCount > 0) {
      ctx.emit({
        type: "step",
        step: "images",
        status: "success",
        frameIndex: undefined,
        output: { imageCount: result.imageCount },
      });
    }

    if (result.skipped) {
      ctx.emit({
        type: "step",
        step: "images",
        status: "success",
        frameIndex: undefined,
        output: { skipped: true, reason: result.reason },
      });
    }

    return { html: result.html };
  } catch (error) {
    if (error instanceof Error) {
      ctx.logger.error(`[Images Step] Generation failed:\n${error.message}`);
    } else {
      ctx.logger.error(`[Images Step] Generation failed:`, { error });
    }

    return { html };
  }
};
