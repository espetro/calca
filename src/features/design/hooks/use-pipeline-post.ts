import { useCallback } from "react";

/**
 * Custom hook for making POST requests to pipeline endpoints.
 *
 * Handles streaming responses where the server may send whitespace pings
 * before the actual JSON data. Strips leading/trailing whitespace before parsing.
 *
 * @returns A memoized function that performs POST requests to pipeline endpoints
 */
export const usePipelinePost = () => {
  const pipelinePost = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      signal: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });

      const text = await res.text();
      const trimmed = text.trim();

      let data: Record<string, unknown>;

      try {
        data = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        throw new Error(
          `Invalid response from ${url}: ${trimmed.slice(0, 120)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(
          (data.error as string) || `Request to ${url} failed`
        );
      }

      return data;
    },
    []
  );

  return pipelinePost;
};
