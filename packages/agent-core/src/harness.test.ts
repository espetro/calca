import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { jsonSchema, tool } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV3 } from "ai/test";
import { describe, expect, it } from "vitest";

import { aiSdkHarness } from "./ai-sdk.js";
import type { Capabilities } from "./harness.js";

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

const textParts = (delta: string): LanguageModelV3StreamPart[] => [
  { type: "stream-start" as const, warnings: [] },
  { type: "text-start" as const, id: "1" },
  { type: "text-delta" as const, id: "1", delta },
  { type: "text-end" as const, id: "1" },
  { type: "finish" as const, finishReason: { unified: "stop" as const, raw: undefined }, usage },
];

describe("aiSdkHarness", () => {
  it("streams model text through to the caller", async () => {
    const model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: convertArrayToReadableStream(textParts("hello")),
      }),
    });

    const parts = [];
    for await (const part of aiSdkHarness().stream({
      agent: { name: "test" },
      model,
      messages: [{ role: "user", content: "hi" }],
    })) {
      parts.push(part);
    }

    const deltas = parts.filter((p) => p.type === "text-delta");
    expect(deltas.map((p) => (p.type === "text-delta" ? p.text : ""))).toEqual(["hello"]);
    expect(parts.at(-1)?.type).toBe("finish");
  });

  it("executes tools and exposes capabilities via experimental_context", async () => {
    const capabilities: Capabilities = { canvas: { addFrame: "fn" } };
    let seenContext: unknown;
    let calls = 0;

    const echo = tool({
      description: "echo the value",
      inputSchema: jsonSchema<{ v: string }>({
        type: "object",
        properties: { v: { type: "string" } },
        required: ["v"],
        additionalProperties: false,
      }),
      execute: (input, options) => {
        seenContext = options.experimental_context;
        return Promise.resolve(input.v);
      },
    });

    const model = new MockLanguageModelV3({
      doStream: () => {
        calls += 1;
        const parts: LanguageModelV3StreamPart[] =
          calls === 1
            ? [
                { type: "stream-start" as const, warnings: [] },
                {
                  type: "tool-call" as const,
                  toolCallId: "c1",
                  toolName: "echo",
                  input: JSON.stringify({ v: "x" }),
                },
                {
                  type: "finish" as const,
                  finishReason: { unified: "tool-calls" as const, raw: undefined },
                  usage,
                },
              ]
            : textParts("done");
        return Promise.resolve({ stream: convertArrayToReadableStream(parts) });
      },
    });

    const types = [];
    for await (const part of aiSdkHarness().stream({
      agent: { name: "test", tools: { echo } },
      model,
      messages: [{ role: "user", content: "use echo" }],
      capabilities,
    })) {
      types.push(part.type);
    }

    expect(calls).toBe(2);
    expect(types).toContain("tool-call");
    expect(types).toContain("tool-result");
    expect(seenContext).toBe(capabilities);
  });
});
