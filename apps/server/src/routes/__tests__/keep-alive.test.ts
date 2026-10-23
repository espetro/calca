import { describe, expect, it, vi } from "vitest";

import { withKeepAlive } from "../workflow";

function byteStream(chunks: string[], closeAfterMs = 0): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      if (closeAfterMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, closeAfterMs));
      }
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

describe("withKeepAlive", () => {
  it("passes source chunks through unchanged when faster than the interval", async () => {
    const source = byteStream(["data: one\n\n", "data: two\n\n"]);
    const result = await readAll(withKeepAlive(source, 60_000));
    expect(result).toBe("data: one\n\ndata: two\n\n");
  });

  it("injects :keep-alive comments at the configured interval", async () => {
    vi.useFakeTimers();
    try {
      // Source stays open for 250ms with no chunks; interval is 100ms.
      const source = byteStream(["data: start\n\n"], 250);
      const transformed = withKeepAlive(source, 100);
      const reader = transformed.getReader();
      const decoder = new TextDecoder();

      let out = "";
      const readUntilClosed = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          out += decoder.decode(value, { stream: true });
        }
      })();

      await vi.advanceTimersByTimeAsync(250);
      await readUntilClosed;

      const keepAlives = out.split(":keep-alive\n\n").length - 1;
      expect(keepAlives).toBeGreaterThanOrEqual(2);
      expect(out).toContain("data: start\n\n");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the interval when the source errors", async () => {
    const errored = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("boom"));
      },
    });

    await expect(readAll(withKeepAlive(errored, 50))).rejects.toThrow("boom");

    // If the interval leaked, the pending timer would keep vitest alive or
    // enqueue into a closed stream — a clean exit here proves the cleanup.
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
});
