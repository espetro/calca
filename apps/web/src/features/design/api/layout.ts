import { type ImagePart, type ModelMessage, type TextPart } from "ai";
import { NextRequest } from "next/server";
import { streamAnthropic } from "@app/core/ai/client";
import type { ProviderType } from "@app/core/ai/providers";
import { buildNewPrompt, buildRevisionUserContent } from "@app/core/prompts/layout";
import { validateLayout } from "@app/shared";
import { parseHtmlWithSize } from "../lib/parse-html";
import { stripBase64Images } from "../lib/strip-base64";

export const maxDuration = 300;

const DEFAULT_MODEL = "claude-sonnet-4-20250514";



export async function handleLayout(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt, style, model, apiKey, systemPrompt, critique,
      availableSources = [], revision, existingHtml,
      contextImages = [],
      providerType,
      baseURL,
    } = body;

    const useModel = model || DEFAULT_MODEL;
    const isRevision = !!(revision && existingHtml);

    let userContent: string;
    let restoreFn: ((s: string) => string) | null = null;

    if (isRevision) {
      const { stripped, restore } = stripBase64Images(existingHtml);
      restoreFn = restore;
      userContent = buildRevisionUserContent(systemPrompt, stripped, prompt, revision);
    } else {
      userContent = buildNewPrompt(systemPrompt, critique, prompt, style, availableSources);
    }

    // Build message parts — text + optional context images
    const userParts: (TextPart | ImagePart)[] = [];

    // Add user-provided images — these should appear IN the design as <img> tags
    const imageTokenMap: Record<string, string> = {}; // [USER_IMAGE_1] -> data:image/...
    if (contextImages && contextImages.length > 0) {
      const validTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
      const imageRefs: string[] = [];

      for (let i = 0; i < contextImages.length; i++) {
        const dataUrl = contextImages[i];
        const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match && validTypes.has(match[1])) {
          const token = `[USER_IMAGE_${i + 1}]`;
          imageTokenMap[token] = dataUrl;

          userParts.push({
            type: "image",
            image: dataUrl,
          });
          imageRefs.push(`- Image ${i + 1}: Use src="${token}" to place this image`);
        }
      }

      userParts.push({
        type: "text",
        text: `USER-PROVIDED IMAGES — USE THESE IN THE DESIGN:
The ${imageRefs.length} image${imageRefs.length > 1 ? "s" : ""} above ${imageRefs.length > 1 ? "are" : "is"} provided by the user to include IN the design.

${imageRefs.join("\n")}

RULES FOR USER IMAGES:
- Place them as <img> tags using the token as the src attribute (e.g., <img src="${imageRefs.length > 0 ? `[USER_IMAGE_1]` : ""}" />)
- Position them where they fit best in the design layout
- You can use each image once or multiple times
- Style them with CSS (border-radius, object-fit, shadows, etc.)
- Do NOT use placeholder divs for content these images cover
- You can STILL use data-placeholder divs for ADDITIONAL images beyond what the user provided

`,
      });
    }

    userParts.push({ type: "text", text: userContent });

    // Build messages array
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: userParts.length === 1 && userParts[0].type === "text"
          ? userParts[0].text
          : userParts,
      },
    ];

    // Use streaming to avoid Vercel timeout — stream keeps connection alive
    const stream = streamAnthropic({
      model: useModel,
      apiKey,
      providerType: providerType as ProviderType | undefined,
      baseURL,
      messages,
      maxTokens: 16384,
      enableCaching: true, // Enable prompt caching for layout stage (highest ROI)
      systemPrompt: systemPrompt || '', // Include system prompt in cache key
    });

    // Collect the full response via streaming, then return JSON
    // We use a ReadableStream to keep the connection alive with periodic pings
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send a space immediately to establish the connection
          controller.enqueue(encoder.encode(" "));

          const pingInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(" "));
            } catch {
              // stream already closed
            }
          }, 5000);

          const fullText = await stream.text;
          clearInterval(pingInterval);

          let result;
          try {
            result = validateLayout(fullText);
          } catch (validationErr) {
            console.warn("Layout validation failed:", validationErr);
            result = parseHtmlWithSize(fullText, { extractComments: true });
          }

          if (restoreFn) {
            result = { ...result, html: restoreFn(result.html) };
          }

          // Replace user image tokens with actual data URLs
          for (const [token, dataUrl] of Object.entries(imageTokenMap)) {
            result.html = result.html.replaceAll(token, dataUrl);
          }

          // Send the actual JSON result
          controller.enqueue(encoder.encode(JSON.stringify(result)));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Layout generation failed";
          console.error("Layout streaming error:", msg);
          controller.enqueue(encoder.encode(JSON.stringify({ error: msg })));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Layout generation failed";
    console.error("Layout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
