import { generateImage } from "ai";

import { getGeminiImageModel } from "../ai/providers";
import { getLogger } from "@app/logger";

export type ImageSource = "unsplash" | "dalle" | "gemini";

const logger = getLogger(["calca", "core", "pipeline", "images"]);

export function getClosestDalleSize(width: number, height: number): string {
  const DALLE_MAX_WIDTH = 1024;
  const DALLE_MAX_HEIGHT = 1792;

  const aspectRatio = width / height;

  if (aspectRatio >= 1.3) {
    return "1792x1024";
  }
  if (aspectRatio <= 0.77) {
    return "1024x1792";
  }
  return "1024x1024";
}

export interface Placeholder {
  id: string;
  description: string;
  width: number;
  height: number;
  source: ImageSource;
  query?: string;
  originalWidth?: number;
  originalHeight?: number;
}

async function generateUnsplashImage(ph: Placeholder, unsplashKey: string): Promise<string | null> {
  const rawQuery = ph.query || ph.description;
  const query = rawQuery.split(/[,.]/)[0].split(" ").slice(0, 5).join(" ");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${ph.width > ph.height * 1.3 ? "landscape" : (ph.height > ph.width * 1.3 ? "portrait" : "squarish")}`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${unsplashKey}` } });
  if (!res.ok) {return null;}
  const data = (await res.json()) as { results?: { urls: { raw: string } }[] };
  const photo = data.results?.[0];
  if (!photo) {return null;}
  return `${photo.urls.raw}&w=${ph.width}&h=${ph.height}&fit=crop&auto=format`;
}

async function generateDalleImage(ph: Placeholder, openaiKey: string): Promise<string | null> {
  const size = getClosestDalleSize(ph.width, ph.height);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    body: JSON.stringify({
      model: "dall-e-3",
      n: 1,
      prompt: `${ph.description}. Generate at ${ph.width}x${ph.height} (scaled to fit within model limits). Clean, professional design asset suitable for web/marketing. No text unless specifically requested.`,
      response_format: "b64_json",
      size,
    }),
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    method: "POST",
  });
  if (!res.ok) {return null;}
  const data = (await res.json()) as { data?: { b64_json: string }[] };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {return null;}
  return `data:image/png;base64,${b64}`;
}

async function generateGeminiImage(ph: Placeholder, geminiKey: string): Promise<string | null> {
  try {
    const { image } = await generateImage({
      model: getGeminiImageModel(geminiKey),
      prompt: `Generate a high quality design asset image at ${ph.width}x${ph.height}: ${ph.description}. Clean, professional, suitable for web/marketing design. No text unless specifically requested. Output only the image.`,
    });
    return `data:${image.mediaType};base64,${image.base64}`;
  } catch (error) {
    logger.warn(`Gemini generation failed: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

export async function generateImages(params: {
  html: string;
  geminiKey?: string;
  unsplashKey?: string;
  openaiKey?: string;
  viewport?: { width: number; height: number };
}): Promise<{ html: string; imageCount: number; skipped?: boolean; reason?: string }> {
  const { html, geminiKey, unsplashKey, openaiKey, viewport } = params;

  const DEFAULT_FRAME_WIDTH = 480;
  const viewportWidth = viewport?.width || DEFAULT_FRAME_WIDTH;
  const viewportHeight = viewport?.height;

  // Parse placeholders from HTML
  const availableSources: string[] = [];
  if (unsplashKey) {availableSources.push("unsplash");}
  if (openaiKey) {availableSources.push("dalle");}
  if (geminiKey) {availableSources.push("gemini");}

  if (availableSources.length === 0) {
    return { html, imageCount: 0, reason: "No image API keys", skipped: true };
  }

  const placeholders: Placeholder[] = [];
  const regex =
    /data-placeholder="([^"]+)"\s+data-ph-w="(\d+)"\s+data-ph-h="(\d+)"(?:\s+data-img-source="([^"]*)")?(?:\s+data-img-query="([^"]*)")?/g;
  let match;
  let idx = 0;
  const defaultSource: ImageSource = availableSources.includes("unsplash")
    ? "unsplash"
    : (availableSources.includes("dalle")
      ? "dalle"
      : "gemini");
  while ((match = regex.exec(html)) !== null) {
    let source = (match[4] || defaultSource) as ImageSource;
    if (!availableSources.includes(source)) {source = defaultSource;}

    const htmlWidth = Number.parseInt(match[2], 10);
    const htmlHeight = Number.parseInt(match[3], 10);

    placeholders.push({
      description: match[1],
      height: viewportHeight || htmlHeight,
      id: `ph-${idx++}`,
      originalHeight: htmlHeight,
      originalWidth: htmlWidth,
      query: match[5] || undefined,
      source,
      width: viewportWidth || htmlWidth,
    });
  }

  if (placeholders.length === 0) {
    return { html, imageCount: 0, reason: "No placeholders found", skipped: true };
  }

  // Generate images
  const imageMap = new Map<number, string>();
  const fallbackChain: ImageSource[] = [];
  if (unsplashKey) {fallbackChain.push("unsplash");}
  if (openaiKey) {fallbackChain.push("dalle");}
  if (geminiKey) {fallbackChain.push("gemini");}

  const batchSize = 6; // Tuned for better parallelism while respecting provider rate limits
  const batchCount = Math.ceil(placeholders.length / batchSize);
  logger.info(
    `Starting generation for ${placeholders.length} images in ${batchCount} batches of ${batchSize}`,
  );

  for (let batchNum = 0; batchNum < batchCount; batchNum++) {
    const batchStart = Date.now();
    const i = batchNum * batchSize;
    const batch = placeholders.slice(i, i + batchSize);

    logger.debug(
      `Batch ${batchNum + 1}/${batchCount} started (${batch.length} images: ${i}-${Math.min(i + batchSize - 1, placeholders.length - 1)})`,
    );

    const results = await Promise.allSettled(
      batch.map(async (ph, batchIdx) => {
        const globalIdx = i + batchIdx;
        const sources = [ph.source, ...fallbackChain.filter((s) => s !== ph.source)];

        for (const source of sources) {
          try {
            let result: string | null = null;
            switch (source) {
              case "unsplash": {
                if (unsplashKey) {result = await generateUnsplashImage(ph, unsplashKey);}
                break;
              }
              case "dalle": {
                if (openaiKey) {result = await generateDalleImage(ph, openaiKey);}
                break;
              }
              case "gemini": {
                if (geminiKey) {result = await generateGeminiImage(ph, geminiKey);}
                break;
              }
            }
            if (result) {
              logger.debug(`Image ${globalIdx} generated successfully using ${source}`);
              imageMap.set(globalIdx, result);
              return;
            }
          } catch (error) {
            logger.error(
              `Image ${globalIdx} failed with ${source}: ${error instanceof Error ? error.message : error}`,
            );
          }
        }
        logger.debug(`Image ${globalIdx} failed - all providers exhausted`);
      }),
    );

    const batchElapsed = Date.now() - batchStart;
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && imageMap.has(i + results.indexOf(r)),
    ).length;
    logger.info(
      `Batch ${batchNum + 1}/${batchCount} completed in ${batchElapsed}ms (${successCount}/${batch.length} successful)`,
    );
  }

  // Composite images into HTML
  let result = html;
  const replaceRegex =
    /<div\s+data-placeholder="[^"]*"\s+data-ph-w="\d+"\s+data-ph-h="\d+"[^>]*>[\s\S]*?<\/div>/g;
  let replaceIdx = 0;
  result = result.replace(replaceRegex, (matchStr: string) => {
    const dataUrl = imageMap.get(replaceIdx);
    const ph = placeholders[replaceIdx];
    replaceIdx++;
    if (dataUrl && ph) {
      const displayWidth = ph.originalWidth || ph.width;
      const displayHeight = ph.originalHeight || ph.height;
      return `<img src="${dataUrl}" alt="${ph.description}" style="width:${displayWidth}px;height:${displayHeight}px;object-fit:cover;border-radius:8px;display:block;" />`;
    }
    return matchStr;
  });

  return { html: result, imageCount: imageMap.size };
}
