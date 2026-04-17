import { useMutation } from "@tanstack/react-query";

interface PipelinePostProps {
  url: string;
  body: Record<string, unknown>;
  signal: AbortSignal;
}

const postToPipeline = async ({ url, body, signal }: PipelinePostProps) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  const trimmed = text.trim();

  let data: unknown;

  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error(`Invalid response from ${url}: ${trimmed.slice(0, 120)}`);
  }

  // Runtime type guard for error response
  if (typeof data !== "object" || data === null) {
    throw new Error(`Invalid response format from ${url}`);
  }

  if (!res.ok || "error" in data) {
    const errorMessage =
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request to ${url} failed`;
    throw new Error(errorMessage);
  }

  return data as Record<string, unknown>;
};

export const usePipelinePost = () => {
  return useMutation({
    mutationFn: postToPipeline,
  });
};
