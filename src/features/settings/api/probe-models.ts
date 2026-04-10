import { NextRequest, NextResponse } from "next/server";
import { probeModels } from "@app/core/ai/probe";

export const maxDuration = 30;

export async function handleProbeModels(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: "apiKey required" }, { status: 400 });
    }
    const available = await probeModels(apiKey);
    return NextResponse.json({ available });
  } catch (err) {
    console.error("Probe error:", err);
    return NextResponse.json({ error: "Probe failed" }, { status: 500 });
  }
}
