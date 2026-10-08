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

const defaultGenerateImpl = async (options: GenerateOptions) => {
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
      result: {
        text: JSON.stringify({ title: "Nice card", rationale: "nice" }),
      } as typeof baseResult,
      usedModel: options.model ?? "model",
    };
  }

  return { result: baseResult, usedModel: options.model ?? "model" };
};

function setupMocks() {
  vi.clearAllMocks();

  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementation(defaultGenerateImpl);

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

    const stream = designPipelineStream({
      prompt: "a card",
      mode: "detailed",
      critique: true,
      model: "model",
    });
    const parts = await readStream(stream);

    const workflowParts = parts.filter((p) => p.type === "data-workflow");
    expect(workflowParts.length).toBeGreaterThan(0);

    const last = workflowParts[workflowParts.length - 1] as unknown as {
      data: { status: string; steps: Record<string, { output?: unknown }> };
    };
    expect(last.data.status).toBe("success");
    expect(last.data.steps.collectResults?.output).toMatchObject({
      frames: [expect.objectContaining({ label: "Variation 1" })],
      summary: { rationale: "nice", title: "Nice card" },
    });
  });

  it("strips reasoning blocks from streamed frame html", async () => {
    setupMocks();
    (streamAnthropic as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: Promise.resolve(
        `<think>let me design a card</think>\n<!--size:400x300-->\n<div>hello</div>\n<reasoning>done</reasoning>`,
      ),
    });

    const stream = designPipelineStream({ prompt: "a card", mode: "detailed", model: "model" });
    const parts = await readStream(stream);

    const last = parts.filter((p) => p.type === "data-workflow").pop() as unknown as {
      data: { steps: { collectResults?: { output?: { frames?: Array<{ html: string }> } } } };
    };
    const html = last.data.steps.collectResults?.output?.frames?.[0]?.html ?? "";
    expect(html).toContain("<div>hello</div>");
    expect(html).not.toMatch(/<(think|reasoning)/i);
  });

  it("still completes with frames when the summary step throws", async () => {
    setupMocks();
    (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementation(
      async (options: GenerateOptions) => {
        if (options.functionId === "summary") {
          throw new Error("summary exploded");
        }
        return defaultGenerateImpl(options);
      },
    );

    const stream = designPipelineStream({ prompt: "a card", mode: "detailed", model: "model" });
    const parts = await readStream(stream);

    const last = parts.filter((p) => p.type === "data-workflow").pop() as unknown as {
      data: {
        status: string;
        steps: { collectResults?: { output?: { frames?: unknown[]; summary?: unknown } } };
      };
    };
    const frames = last.data.steps.collectResults?.output?.frames;
    expect(frames?.length).toBeGreaterThan(0);
    expect(last.data.steps.collectResults?.output?.summary).toBeUndefined();
    expect(parts.some((p) => p.type === "error")).toBe(false);
  });
});
