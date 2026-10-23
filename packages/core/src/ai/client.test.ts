import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

import { generateCacheKey } from "./client";

describe("generateCacheKey system-prompt sentinel", () => {
  it("hashes undefined and empty-string system prompts to different keys", async () => {
    const undefinedKey = await generateCacheKey(undefined, "anthropic", "model-x", "msg");
    const emptyKey = await generateCacheKey("", "anthropic", "model-x", "msg");
    expect(undefinedKey).not.toBe(emptyKey);
  });

  it("hashes the undefined prompt to the sentinel, not the empty string", async () => {
    const undefinedKey = await generateCacheKey(undefined, "anthropic", "m", "msg");
    const sentinelHash = await generateCacheKey(
      "__NO_SYSTEM_PROMPT__",
      "anthropic",
      "m",
      "different-msg",
    ).then((k) => k.split(":")[0]);
    expect(undefinedKey.split(":")[0]).toBe(sentinelHash);
  });

  it("is stable and deterministic for identical inputs", async () => {
    const a = await generateCacheKey("sys", "anthropic", "model-x", "msg");
    const b = await generateCacheKey("sys", "anthropic", "model-x", "msg");
    expect(a).toBe(b);
    expect(a).toMatch(/^[\da-f]{16}:anthropic:model-x:[\da-f]{16}$/);
  });
});
