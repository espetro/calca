import type { SummaryData } from "@/shared/types";

interface SummaryRequest {
  html: string;
  prompt: string;
  labels: string[];
  signal: AbortSignal;
}

interface SummaryResponse {
  summary?: SummaryData;
}

export async function fetchSummary(
  request: SummaryRequest
): Promise<SummaryResponse> {
  const res = await fetch("/api/pipeline/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html: request.html,
      prompt: request.prompt,
      labels: request.labels,
    }),
    signal: request.signal,
  });

  const text = await res.text();
  let data: unknown;

  try {
    data = JSON.parse(text.trim());
  } catch {
    throw new Error("Invalid response from summary endpoint");
  }

  if (!res.ok || typeof data !== "object" || data === null) {
    throw new Error(
      typeof (data as { error?: unknown })?.error === "string"
        ? (data as { error: string }).error
        : "Summary generation failed"
    );
  }

  return data as SummaryResponse;
}
