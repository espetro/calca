import { generateImage } from "ai";

import { getGeminiImageModel } from "../ai/providers";

export type ImageSource = "unsplash" | "dalle" | "gemini";

export interface Placeholder {
  id: string;
  description: string;
  width: number;
  height: number;
  source: ImageSource;
  query?: string;
}

async function generateUnsplashImage(ph: Placeholder, unsplashKey: string): Promise<string | null> {
  const rawQuery = ph.query || ph.description;
  const query = rawQuery.split(/[,.]/)[0].split(" ").slice(0, 5).join(" ");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${ph.width > ph.height * 1.3 ? "landscape" : ph.height > ph.width * 1.3 ? "portrait" : "squarish"}`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${unsplashKey}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;
  return `${photo.urls.raw}&w=${ph.width}&h=${ph.height}&fit=crop&auto=format`;
}

async function generateDalleImage(ph: Placeholder, openaiKey: string): Promise<string | null> {
  const size = ph.width > ph.height * 1.3 ? "1792x1024" : ph.height > ph.width * 1.3 ? "1024x1792" : "1024x1024";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `${ph.description}. Clean, professional design asset suitable for web/marketing. No text unless specifically requested.`,
      n: 1, size, response_format: "b64_json",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

async function generateGeminiImage(ph: Placeholder, geminiKey: string): Promise<string | null> {
  try {
    const { image } = await generateImage({
      model: getGeminiImageModel(geminiKey),
      prompt: `Generate a high quality design asset image: ${ph.description}. Clean, professional, suitable for web/marketing design. No text unless specifically requested. Output only the image.`,
    });
    return `data:${image.mediaType};base64,${image.base64}`;
  } catch {
    return null;
  }
}

export async function generateImages(params: {
  html: string;
  geminiKey?: string;
  unsplashKey?: string;
  openaiKey?: string;
}): Promise<{ html: string; imageCount: number; skipped?: boolean; reason?: string }> {
  const { html, geminiKey, unsplashKey, openaiKey } = params;

  // Parse placeholders from HTML
  const availableSources: string[] = [];
  if (unsplashKey) availableSources.push("unsplash");
  if (openaiKey) availableSources.push("dalle");
  if (geminiKey) availableSources.push("gemini");

  if (availableSources.length === 0) {
    return { html, imageCount: 0, skipped: true, reason: "No image API keys" };
  }

  const placeholders: Placeholder[] = [];
  const regex = /data-placeholder="([^"]+)"\s+data-ph-w="(\d+)"\s+data-ph-h="(\d+)"(?:\s+data-img-source="([^"]*)")?(?:\s+data-img-query="([^"]*)")?/g;
  let match;
  let idx = 0;
  const defaultSource: ImageSource = availableSources.includes("unsplash") ? "unsplash" : availableSources.includes("dalle") ? "dalle" : "gemini";
  while ((match = regex.exec(html)) !== null) {
    let source = (match[4] || defaultSource) as ImageSource;
    if (!availableSources.includes(source)) source = defaultSource;
    placeholders.push({
      id: `ph-${idx++}`,
      description: match[1],
      width: parseInt(match[2], 10),
      height: parseInt(match[3], 10),
      source,
      query: match[5] || undefined,
    });
  }

  if (placeholders.length === 0) {
    return { html, imageCount: 0, skipped: true, reason: "No placeholders found" };
  }

  // Generate images
  const imageMap = new Map<number, string>();
  const fallbackChain: ImageSource[] = [];
  if (unsplashKey) fallbackChain.push("unsplash");
  if (openaiKey) fallbackChain.push("dalle");
  if (geminiKey) fallbackChain.push("gemini");

  const batchSize = 3;
  for (let i = 0; i < placeholders.length; i += batchSize) {
    const batch = placeholders.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (ph, batchIdx) => {
        const globalIdx = i + batchIdx;
        const sources = [ph.source, ...fallbackChain.filter(s => s !== ph.source)];
        for (const source of sources) {
          try {
            let result: string | null = null;
            switch (source) {
              case "unsplash": if (unsplashKey) result = await generateUnsplashImage(ph, unsplashKey); break;
              case "dalle": if (openaiKey) result = await generateDalleImage(ph, openaiKey); break;
              case "gemini": if (geminiKey) result = await generateGeminiImage(ph, geminiKey); break;
            }
            if (result) { imageMap.set(globalIdx, result); return; }
          } catch (err) {
            console.error(`Image ${globalIdx} ${source} failed:`, err instanceof Error ? err.message : err);
          }
        }
      })
    );
  }

  // Composite images into HTML
  let result = html;
  const replaceRegex = /<div\s+data-placeholder="[^"]*"\s+data-ph-w="\d+"\s+data-ph-h="\d+"[^>]*>[\s\S]*?<\/div>/g;
  let replaceIdx = 0;
  result = result.replace(replaceRegex, (matchStr: string) => {
    const dataUrl = imageMap.get(replaceIdx);
    const ph = placeholders[replaceIdx];
    replaceIdx++;
    if (dataUrl && ph) {
      return `<img src="${dataUrl}" alt="${ph.description}" style="width:${ph.width}px;height:${ph.height}px;object-fit:cover;border-radius:8px;display:block;" />`;
    }
    return matchStr;
  });

  return { html: result, imageCount: imageMap.size };
}
