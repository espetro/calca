import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "hono";

// Mock dependencies before importing the handler
vi.mock("@mastra/ai-sdk", () => ({
  handleWorkflowStream: vi.fn(),
}));

vi.mock("ai", () => ({
  createUIMessageStreamResponse: vi.fn(),
}));

vi.mock("../../workflows/mastra", () => ({
  mastra: { _mock: true },
}));

import { handleWorkflowStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { handleWorkflow } from "../workflow";

function createMockContext(body: unknown): Context {
  return {
    req: {
      json: vi.fn().mockResolvedValue(body),
    },
  } as unknown as Context;
}

describe("handleWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a UI message stream response on success", async () => {
    const mockStream = { [Symbol.asyncIterator]: vi.fn() };
    const mockResponse = new Response(null, { status: 200 });

    (handleWorkflowStream as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
    (createUIMessageStreamResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);

    const ctx = createMockContext({ prompt: "a pricing card" });
    const result = await handleWorkflow(ctx);

    expect(ctx.req.json).toHaveBeenCalledOnce();
    expect(handleWorkflowStream).toHaveBeenCalledOnce();
    expect(handleWorkflowStream).toHaveBeenCalledWith({
      mastra: expect.anything(),
      params: { inputData: { prompt: "a pricing card" } },
      version: "v6",
      workflowId: "designPipeline",
    });
    expect(createUIMessageStreamResponse).toHaveBeenCalledWith({ stream: mockStream });
    expect(result).toBe(mockResponse);
  });

  it("propagates errors from handleWorkflowStream", async () => {
    (handleWorkflowStream as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("workflow exploded"),
    );

    const ctx = createMockContext({ prompt: "fail" });

    await expect(handleWorkflow(ctx)).rejects.toThrow("workflow exploded");
    expect(createUIMessageStreamResponse).not.toHaveBeenCalled();
  });

  it("passes the full request body as inputData", async () => {
    const body = { conceptCount: 4, preset: "marketing", prompt: "hero section" };
    const mockStream = {};
    const mockResponse = new Response(null, { status: 200 });

    (handleWorkflowStream as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
    (createUIMessageStreamResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);

    const ctx = createMockContext(body);
    await handleWorkflow(ctx);

    expect(handleWorkflowStream).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { inputData: body },
      }),
    );
  });
});
