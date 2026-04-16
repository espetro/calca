import { useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePipelinePost = (): ((url: string, body: Record<string, unknown>, signal: AbortSignal) => Promise<any>) => {
  const pipelinePost = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      signal: AbortSignal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });

      const text = await res.text();
      const trimmed = text.trim();

      let data: any;

      try {
        data = JSON.parse(trimmed);
      } catch {
        throw new Error(
          `Invalid response from ${url}: ${trimmed.slice(0, 120)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `Request to ${url} failed`);
      }

      return data;
    },
    []
  );

  return pipelinePost;
};
