import { streamAnthropic } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildNewPrompt, buildRevisionUserContent } from "@app/core/prompts/layout";
import { validateLayout } from "@app/shared";
import { type ImagePart, type ModelMessage, type TextPart } from "ai";

import { parseHtmlWithSize } from "../lib/parse-html";
import { stripBase64Images } from "../lib/strip-base64";
import type { LayoutInput, LayoutOutput, Step, StepContext } from "../types";

const HEARTBEAT_INTERVAL_MS = 5_000;

export const layoutStep: Step<LayoutInput, LayoutOutput> = async (input, ctx: StepContext) => {
  const {
    prompt,
    contextImages = [],
    critique,
    revision,
    existingHtml,
    systemPrompt,
    model,
    apiKey,
    baseURL,
    providerType,
    frameIndex,
  } = input;

  const useModel = model;
  const isRevision = !!(revision && existingHtml);
  const frameIdx = frameIndex ?? 0;
  const functionId = `layout:${frameIdx + 1}`;

  let userContent: string;
  let restoreFn: ((s: string) => string) | null = null;

  if (isRevision && existingHtml) {
    const { stripped, restore } = stripBase64Images(existingHtml);
    restoreFn = restore;
    userContent = buildRevisionUserContent(systemPrompt, stripped, prompt, String(revision));
  } else {
    userContent = buildNewPrompt(systemPrompt, critique, prompt, "", []);
  }

  const userParts: (TextPart | ImagePart)[] = [];
  const imageTokenMap: Record<string, string> = {};

  if (contextImages.length > 0) {
    const validTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
    const imageRefs: string[] = [];

    for (let i = 0; i < contextImages.length; i++) {
      const dataUrl = contextImages[i]!;
      const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match && validTypes.has(match[1])) {
        const token = `[USER_IMAGE_${i + 1}]`;
        imageTokenMap[token] = dataUrl;

        userParts.push({ type: "image", image: dataUrl });
        imageRefs.push(`- Image ${i + 1}: Use src="${token}" to place this image`);
      }
    }

    if (imageRefs.length > 0) {
      userParts.push({
        type: "text",
        text: `USER-PROVIDED IMAGES — USE THESE IN THE DESIGN:
The ${imageRefs.length} image${imageRefs.length > 1 ? "s" : "is"} provided by the user to include IN the design.

${imageRefs.join("\n")}

RULES FOR USER IMAGES:
- Place them as <img> tags using the token as the src attribute (e.g., <img src="[USER_IMAGE_1]" />)
- Position them where they fit best in the design layout
- You can use each image once or multiple times
- Style them with CSS (border-radius, object-fit, shadows, etc.)
- Do NOT use placeholder divs for content these images cover
- You can STILL use data-placeholder divs for ADDITIONAL images beyond what the user provided

`,
      });
    }
  }

  userParts.push({ type: "text", text: userContent });

  const messages: ModelMessage[] = [
    {
      role: "user",
      content:
        userParts.length === 1 && userParts[0]!.type === "text" ? userParts[0]!.text : userParts,
    },
  ];

  const stream = await streamAnthropic({
    model: useModel,
    apiKey,
    providerType: providerType as ProviderType | undefined,
    baseURL,
    messages,
    maxTokens: 16384,
    enableCaching: true,
    systemPrompt: systemPrompt || "",
    functionId,
    frameIndex: frameIdx,
    onFinish: (event) => ctx.tokenUsage?.add(event.usage),
  });

  const heartbeatInterval = setInterval(() => {
    ctx.emit({ type: "step", step: "layout", status: "running", frameIndex: frameIdx });
  }, HEARTBEAT_INTERVAL_MS);

  try {
    const fullText = await Promise.race([
      stream.text,
      new Promise<never>((_, reject) => {
        if (ctx.signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        ctx.signal.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      }),
    ]);

    clearInterval(heartbeatInterval);

    let result: { html: string; width?: number; height?: number; comment?: string };
    try {
      result = validateLayout(fullText);
    } catch {
      result = parseHtmlWithSize(fullText, { extractComments: true });
    }

    if (restoreFn) {
      result = { ...result, html: restoreFn(result.html) };
    }

    for (const [token, dataUrl] of Object.entries(imageTokenMap)) {
      result.html = result.html.replaceAll(token, dataUrl);
    }

    return {
      html: result.html,
      width: result.width,
      height: result.height,
      comment: result.comment,
    };
  } finally {
    clearInterval(heartbeatInterval);
  }
};
