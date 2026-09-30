import type { GenerateOptions } from "@app/core/ai/client";
import type { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@app/core/ai/client", () => ({
  generateWithFallback: vi.fn(),
  streamAnthropic: vi.fn(),
}));

vi.mock("@app/core/pipeline/images", () => ({
  generateImages: vi.fn(),
}));

import { generateWithFallback, streamAnthropic } from "@app/core/ai/client";
import { generateImages } from "@app/core/pipeline/images";

import { handleWorkflow } from "../workflow";

function createMockContext(body: unknown): Context {
  return {
    req: {
      json: vi.fn().mockResolvedValue(body),
    },
  } as unknown as Context;
}

async function readStream(
  response: Response,
): Promise<Array<{ type: string; [key: string]: unknown }>> {
  const reader = response.body!.getReader();
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
  if (buffer.trim()) {
    const colonIdx = buffer.indexOf(":");
    if (colonIdx !== -1) {
      try {
        parts.push(
          JSON.parse(buffer.slice(colonIdx + 1)) as { type: string; [key: string]: unknown },
        );
      } catch {
        // ignore
      }
    }
  }
  return parts;
}

function buildInput(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    prompt: "a pricing card",
    mode: "sequential",
    model: "claude-model",
    ...overrides,
  };
}

function mockGenerateWithFallback() {
  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementation(
    async (options: GenerateOptions) => {
      const functionId = options.functionId ?? "";

      if (functionId === "plan") {
        return {
          result: {
            text: JSON.stringify([{ name: "Minimal", direction: "Clean" }]),
          } as Awaited<ReturnType<typeof generateWithFallback>>["result"],
          usedModel: options.model ?? "model",
        };
      }

      if (functionId.startsWith("review")) {
        return {
          result: { text: "<div>reviewed</div>" } as Awaited<
            ReturnType<typeof generateWithFallback>
          >["result"],
          usedModel: options.model ?? "model",
        };
      }

      if (functionId.startsWith("critique")) {
        return {
          result: { text: "Looks good" } as Awaited<
            ReturnType<typeof generateWithFallback>
          >["result"],
          usedModel: options.model ?? "model",
        };
      }

      if (functionId === "summary") {
        return {
          result: { text: JSON.stringify({ rationale: "nice" }) } as Awaited<
            ReturnType<typeof generateWithFallback>
          >["result"],
          usedModel: options.model ?? "model",
        };
      }

      return {
        result: { text: "" } as Awaited<ReturnType<typeof generateWithFallback>>["result"],
        usedModel: options.model ?? "model",
      };
    },
  );
}

function mockStreamAnthropic() {
  (streamAnthropic as ReturnType<typeof vi.fn>).mockResolvedValue({
    text: Promise.resolve(`<!--size:400x300-->\n<div>hello</div>`),
  });
}

function mockGenerateImages() {
  (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async () => ({
    html: `<div>hello</div>`,
    imageCount: 0,
    skipped: true,
    reason: "no keys",
  }));
}

describe("handleWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateWithFallback();
    mockStreamAnthropic();
    mockGenerateImages();
  });

  it("returns an SSE response with correct headers", async () => {
    const ctx = createMockContext(buildInput());
    const response = await handleWorkflow(ctx);

    expect(response.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");
  });

  it("streams data-workflow parts through the pipeline", async () => {
    const ctx = createMockContext(buildInput());
    const response = await handleWorkflow(ctx);
    const parts = await readStream(response);

    const workflowParts = parts.filter((p) => p.type === "data-workflow");
    expect(workflowParts.length).toBeGreaterThan(0);

    const first = workflowParts[0] as unknown as {
      data: { name: string; status: string; steps: Record<string, unknown> };
    };
    expect(first.data.name).toBe("designPipeline");
    expect(first.data.status).toBe("running");
    expect(first.data.steps.plan).toMatchObject({ name: "plan", status: "running" });

    const last = workflowParts[workflowParts.length - 1] as unknown as {
      data: {
        status: string;
        steps: Record<string, { output?: unknown }>;
      };
    };
    expect(last.data.status).toBe("success");
    expect(last.data.steps.collectResults?.output).toMatchObject({
      frames: [
        expect.objectContaining({
          html: "<div>reviewed</div>",
          label: "Variation 1",
        }),
      ],
      summary: expect.stringContaining("rationale"),
    });
  });

  it("passes the full request body to the pipeline", async () => {
    const body = { conceptCount: 4, mode: "quick", prompt: "hero section", model: "claude-model" };
    const ctx = createMockContext(body);
    const response = await handleWorkflow(ctx);
    await readStream(response);

    expect(ctx.req.json).toHaveBeenCalledOnce();
    expect(streamAnthropic).toHaveBeenCalledWith(expect.objectContaining({ model: body.model }));
  });

  it("emits an error part when the pipeline throws", async () => {
    (streamAnthropic as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("layout exploded"));

    const ctx = createMockContext(buildInput());
    const response = await handleWorkflow(ctx);
    const parts = await readStream(response);

    const errorParts = parts.filter((p) => p.type === "error");
    expect(errorParts.length).toBeGreaterThan(0);
    expect(errorParts[0]).toMatchObject({ type: "error", errorText: "layout exploded" });
  });
});
