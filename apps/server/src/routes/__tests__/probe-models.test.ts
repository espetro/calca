import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Context } from "hono";

vi.mock("@app/core/ai/probe", () => ({
  probeModels: vi.fn(),
}));

import { probeModels } from "@app/core/ai/probe";
import { handleProbeModels } from "../probe-models";

function createMockContext(body: unknown): Context {
  const json = vi.fn((data, status) => ({
    status: status ?? 200,
    json: data,
  }));
  return {
    req: {
      json: vi.fn().mockResolvedValue(body),
    },
    json,
  } as unknown as Context;
}

describe("handleProbeModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available models on success", async () => {
    const models = { "claude-opus-4-6": true, "claude-sonnet-4-5": false };
    (probeModels as ReturnType<typeof vi.fn>).mockResolvedValue(models);

    const ctx = createMockContext({ apiKey: "sk-test", providerType: "anthropic" });
    await handleProbeModels(ctx);

    expect(probeModels).toHaveBeenCalledWith("sk-test", undefined, "anthropic");
    expect(ctx.json).toHaveBeenCalledWith({ available: models });
  });

  it("returns 401 when anthropic provider is used without apiKey", async () => {
    const ctx = createMockContext({ providerType: "anthropic" });
    await handleProbeModels(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ error: "apiKey required" }, 401);
    expect(probeModels).not.toHaveBeenCalled();
  });

  it("returns 500 when probeModels throws", async () => {
    (probeModels as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network failure"));

    const ctx = createMockContext({ apiKey: "sk-test" });
    await handleProbeModels(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ error: "Probe failed" }, 500);
  });

  it("passes baseURL and providerType to probeModels", async () => {
    (probeModels as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const ctx = createMockContext({
      apiKey: "sk-test",
      providerType: "openai-compatible",
      baseURL: "http://localhost:1234/v1",
    });
    await handleProbeModels(ctx);

    expect(probeModels).toHaveBeenCalledWith("sk-test", "http://localhost:1234/v1", "openai-compatible");
  });

  it("allows missing apiKey for non-anthropic providers", async () => {
    (probeModels as ReturnType<typeof vi.fn>).mockResolvedValue({ "local-model": true });

    const ctx = createMockContext({ providerType: "openai-compatible", baseURL: "http://localhost:1234/v1" });
    await handleProbeModels(ctx);

    expect(probeModels).toHaveBeenCalledWith("", "http://localhost:1234/v1", "openai-compatible");
    expect(ctx.json).toHaveBeenCalledWith({ available: { "local-model": true } });
  });
});
