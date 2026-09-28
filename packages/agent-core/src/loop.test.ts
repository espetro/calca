import { describe, expect, it } from "vitest";

import type { ModelPort, ModelStreamPart } from "./capabilities.js";
import type { RunEvent } from "./events.js";
import { runAgent } from "./loop.js";
import { textMessage } from "./messages.js";
import { toolDefinition } from "./tool.js";

const port = (steps: ModelStreamPart[][]): ModelPort => {
  let i = 0;
  return {
    stream: () =>
      (steps[i++] ?? [])[Symbol.iterator]() as unknown as AsyncIterable<ModelStreamPart>,
  };
};

describe("runAgent", () => {
  it("finishes on a pure text step", async () => {
    const events: RunEvent[] = [];
    const result = await runAgent({
      agent: { name: "a" },
      messages: [textMessage("user", "hi")],
      capabilities: {
        llm: port([
          [
            { type: "text-delta", text: "hello" },
            { type: "finish", finishReason: "stop" },
          ],
        ]),
      },
      onEvent: (e) => events.push(e),
    });
    expect(result.status).toBe("finished");
    expect(result.text).toBe("hello");
    expect(events.map((e) => e.type)).toEqual([
      "run-started",
      "text-delta",
      "step-finished",
      "run-finished",
    ]);
  });

  it("executes approved tools and resumes the loop", async () => {
    const execCalls: unknown[] = [];
    const t = toolDefinition({
      name: "paint",
      description: "paint a node",
      inputSchema: { type: "object" },
      needsApproval: true,
      execute: (input) => {
        execCalls.push(input);
        return { ok: true };
      },
    });
    const events: RunEvent[] = [];
    const result = await runAgent({
      agent: { name: "a", tools: [t] },
      messages: [textMessage("user", "paint")],
      capabilities: {
        llm: port([
          [
            { type: "tool-call", id: "c1", name: "paint", input: { id: "n1" } },
            { type: "finish", finishReason: "tool-calls" },
          ],
          [
            { type: "text-delta", text: "done" },
            { type: "finish", finishReason: "stop" },
          ],
        ]),
      },
      approve: () => Promise.resolve({ approved: true }),
      onEvent: (e) => events.push(e),
    });
    expect(result.status).toBe("finished");
    expect(execCalls).toEqual([{ id: "n1" }]);
    expect(events.map((e) => e.type)).toContain("approval-requested");
    expect(events.map((e) => e.type)).toContain("tool-result");
    expect(result.messages.at(-1)?.role).toBe("tool");
  });

  it("feeds a denied approval back as an error tool-result", async () => {
    const t = toolDefinition({
      name: "paint",
      description: "paint",
      inputSchema: {},
      needsApproval: true,
      execute: () => ({ ok: true }),
    });
    const result = await runAgent({
      agent: { name: "a", tools: [t] },
      messages: [textMessage("user", "paint")],
      capabilities: {
        llm: port([
          [
            { type: "tool-call", id: "c1", name: "paint", input: {} },
            { type: "finish", finishReason: "tool-calls" },
          ],
          [{ type: "finish", finishReason: "stop" }],
        ]),
      },
      approve: () => Promise.resolve({ approved: false, reason: "user said no" }),
    });
    const toolMsg = result.messages.at(-1);
    const part = toolMsg?.parts[0];
    expect(part?.type).toBe("tool-result");
    expect(part && "isError" in part && part.isError).toBe(true);
    expect(part && "output" in part && String(part.output)).toContain("user said no");
  });
});
