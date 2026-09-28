import type { JSONValue, LanguageModel, ModelMessage, ToolSet } from "ai";
import { jsonSchema, streamText, tool } from "ai";

import type { ModelPort, ModelStreamPart } from "./capabilities.js";
import type { Message } from "./messages.js";
import type { Tool } from "./tool.js";

const toModelMessage = (message: Message): ModelMessage => {
  switch (message.role) {
    case "system":
    case "user":
      return {
        role: message.role,
        content: message.parts.map((p) => (p.type === "text" ? p.text : "")).join(""),
      };
    case "assistant":
      return {
        role: "assistant",
        content: message.parts.map((p) =>
          p.type === "tool-call"
            ? { type: "tool-call" as const, toolCallId: p.id, toolName: p.name, input: p.input }
            : p.type === "tool-result"
              ? { type: "text" as const, text: "" }
              : p,
        ),
      };
    case "tool":
      return {
        role: "tool",
        content: message.parts.flatMap((p) =>
          p.type === "tool-result"
            ? [
                {
                  type: "tool-result" as const,
                  toolCallId: p.callId,
                  toolName: p.name,
                  output: p.isError
                    ? { type: "error-text" as const, value: String(p.output) }
                    : { type: "json" as const, value: p.output as JSONValue },
                },
              ]
            : [],
        ),
      };
  }
};

const toAiTools = (tools: Tool[] | undefined): ToolSet | undefined => {
  if (!tools?.length) return undefined;
  // `execute` is intentionally absent: the loop is the single tool executor,
  // so approvals and capability injection cannot be bypassed by the provider.
  return Object.fromEntries(
    tools.map((t) => [
      t.name,
      tool({
        description: t.description,
        inputSchema:
          typeof t.inputSchema === "object" &&
          t.inputSchema !== null &&
          "~standard" in t.inputSchema
            ? (t.inputSchema as Parameters<typeof tool>[0]["inputSchema"])
            : jsonSchema(t.inputSchema as Record<string, unknown>),
      }),
    ]),
  );
};

/** Wrap an AI SDK `LanguageModel` as a {@link ModelPort}. Peer-dep on `ai`. */
export const aiSdkModel = (model: LanguageModel): ModelPort => ({
  async *stream(request) {
    const result = streamText({
      model,
      messages: request.messages.map(toModelMessage),
      tools: toAiTools(request.tools),
      abortSignal: request.signal,
    });

    for await (const part of result.fullStream) {
      let out: ModelStreamPart | undefined;
      if (part.type === "text-delta") {
        out = { type: "text-delta", text: part.text };
      } else if (part.type === "tool-call") {
        out = { type: "tool-call", id: part.toolCallId, name: part.toolName, input: part.input };
      } else if (part.type === "finish") {
        out = {
          type: "finish",
          finishReason: part.finishReason,
          usage: {
            inputTokens: part.totalUsage.inputTokens ?? 0,
            outputTokens: part.totalUsage.outputTokens ?? 0,
            totalTokens: part.totalUsage.totalTokens ?? 0,
          },
        };
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
      if (out) yield out;
    }
  },
});
