import type { FeedbackFormData, FeedbackSubmitResult } from "./types";

const FEEDBACK_PROXY_URL =
  import.meta.env.VITE_FEEDBACK_PROXY_URL || "http://localhost:3002";

interface SystemInfo {
  appVersion: string;
  os: string;
  screenResolution: string;
  userAgent: string;
  url: string;
}

function getSystemInfo(): SystemInfo {
  return {
    appVersion: "0.3.0",
    os: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
}

export async function submitFeedback(
  data: FeedbackFormData
): Promise<FeedbackSubmitResult> {
  const payload = {
    ...data,
    systemInfo: data.includeSystemInfo ? getSystemInfo() : undefined,
  };

  const response = await fetch(`${FEEDBACK_PROXY_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    const error = new Error("RATE_LIMITED");
    error.name = "RateLimitedError";
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<FeedbackSubmitResult>;
}
