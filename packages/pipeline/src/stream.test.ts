import type { GenerateOptions } from "@app/core/ai/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@app/core/ai/client", () => ({
  generateWithFallback: vi.fn(),
  streamAnthropic: vi.fn(),
}));

vi.mock("@app/core/pipeline/images", () => ({
  generateImages: vi.fn(),
}));

import { generateWithFallback, streamAnthropic } from "@app/core/ai/client";
import { generateImages } from "@app/core/pipeline/images";

import { designPipelineStream } from "./stream";

async function readStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Array<{ type: string; [key: string]: unknown }>> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parts: Array<{ type: string; [key: string]: unknown }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      try {
        parts.push(
          JSON.parse(line.slice(colonIdx + 1)) as { type: string; [key: string]: unknown },
        );
      } catch {
        // ignore malformed lines
      }
    }
  }
  return parts;
}

function setupMocks() {
  vi.clearAllMocks();

  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementation(
    async (options: GenerateOptions) => {
      const functionId = options.functionId ?? "";
      const baseResult = { text: "" } as Awaited<ReturnType<typeof generateWithFallback>>["result"];

      if (functionId === "plan") {
        return {
          result: { text: JSON.stringify([{ name: "Minimal", direction: "Clean" }]) } as Awaited<
            ReturnType<typeof generateWithFallback>
          >["result"],
          usedModel: options.model ?? "model",
        };
      }

      if (functionId.startsWith("review")) {
        return {
          result: { text: "<div>reviewed</div>" } as typeof baseResult,
          usedModel: options.model ?? "model",
        };
      }

      if (functionId.startsWith("critique")) {
        return {
          result: { text: "Looks good" } as typeof baseResult,
          usedModel: options.model ?? "model",
        };
      }

      if (functionId === "summary") {
        return {
          result: { text: JSON.stringify({ rationale: "nice" }) } as typeof baseResult,
          usedModel: options.model ?? "model",
        };
      }

      return { result: baseResult, usedModel: options.model ?? "model" };
    },
  );

  (streamAnthropic as ReturnType<typeof vi.fn>).mockResolvedValue({
    text: Promise.resolve(`<!--size:400x300-->\n<div>hello</div>`),
  });

  (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
    html: `<div>hello</div>`,
    imageCount: 0,
    skipped: true,
    reason: "no keys",
  });
}

describe("designPipelineStream", () => {
  it("emits an error part for invalid input", async () => {
    const stream = designPipelineStream({ prompt: 123 });
    const parts = await readStream(stream);

    expect(parts[0]).toMatchObject({ type: "error", errorText: "Invalid workflow input" });
  });

  it("streams a successful workflow to completion", async () => {
    setupMocks();

    const stream = designPipelineStream({ prompt: "a card", mode: "sequential", model: "model" });
    const parts = await readStream(stream);

    const workflowParts = parts.filter((p) => p.type === "data-workflow");
    expect(workflowParts.length).toBeGreaterThan(0);

    const last = workflowParts[workflowParts.length - 1] as unknown as {
      data: { status: string; steps: Record<string, { output?: unknown }> };
    };
    expect(last.data.status).toBe("success");
    expect(last.data.steps.collectResults?.output).toMatchObject({
      frames: [expect.objectContaining({ label: "Variation 1" })],
    });
  });
});
