import { NextRequest, NextResponse } from "next/server";
import { probeModels } from "@app/core/ai/probe";
import type { ProviderType } from "@app/core/ai/providers";

export const maxDuration = 30;

export async function handleProbeModels(req: NextRequest) {
  try {
    const { apiKey, providerType, baseURL } = (await req.json()) as {
      apiKey?: string;
      providerType?: ProviderType;
      baseURL?: string;
    };
    if (providerType === "anthropic" && !apiKey) {
      return NextResponse.json({ error: "apiKey required" }, { status: 400 });
    }
    const available = await probeModels(apiKey ?? "", baseURL, providerType);
    return NextResponse.json({ available });
  } catch (err) {
    console.error("Probe error:", err);
    return NextResponse.json({ error: "Probe failed" }, { status: 500 });
  }
}
