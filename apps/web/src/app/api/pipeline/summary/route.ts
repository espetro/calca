import { NextRequest, NextResponse } from "next/server";
import { handleSummary } from "@/features/design/api/summary";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.html || !body.prompt) {
      return NextResponse.json(
        { error: "Missing required fields: html, prompt" },
        { status: 400 }
      );
    }
    return handleSummary(req);
  } catch {
    return NextResponse.json(
      { summary: undefined },
      { status: 200 }
    );
  }
}
