import { NextRequest, NextResponse } from "next/server";

import { generateImages } from "@app/core/pipeline/images";

export const maxDuration = 300;

export async function handleImages(req: NextRequest) {
  try {
    const { html, geminiKey, unsplashKey, openaiKey, viewport } = await req.json();
    return NextResponse.json(await generateImages({ html, geminiKey, unsplashKey, openaiKey, viewport }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image generation failed";
    console.error("Images error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
