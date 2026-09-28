import type { RunInput, RunResult } from "./agent.js";
import type { RunEvent } from "./events.js";
import type { Message, ToolCallPart, ToolResultPart } from "./messages.js";
import type { Tool } from "./tool.js";

const denyAll = () => Promise.resolve({ approved: false as const, reason: "no approval handler" });

/**
 * The agent loop. Deliberately thin: provider quirks and streaming live in
 * the {@link import("./capabilities.js").ModelPort} adapter; what stays here
 * is the domain surface — tool dispatch, approval pauses, run events, abort.
 */
export async function runAgent(input: RunInput): Promise<RunResult> {
  const { agent, capabilities, onEvent, approve = denyAll } = input;
  const signal = input.signal;
  const runId = crypto.randomUUID();
  const emit = (event: RunEvent) => onEvent?.(event);

  const messages: Message[] = [...input.messages];
  if (agent.instructions && messages[0]?.role !== "system") {
    messages.unshift({ role: "system", parts: [{ type: "text", text: agent.instructions }] });
  }

  const tools = new Map<string, Tool>((agent.tools ?? []).map((t) => [t.name, t]));
  const maxSteps = agent.maxSteps ?? 16;
  const text: string[] = [];

  const fail = (status: RunResult["status"], error?: unknown): RunResult => ({
    runId,
    status,
    messages,
    text: text.join(""),
    error,
  });

  emit({ type: "run-started", runId });

  try {
    for (let stepIndex = 0; stepIndex < maxSteps; stepIndex++) {
      if (signal?.aborted) {
        emit({ type: "run-finished", runId, status: "cancelled" });
        return fail("cancelled");
      }

      const stepText: string[] = [];
      const calls: ToolCallPart[] = [];
      let finishReason = "stop";
      let usage: RunResult["usage"];

      for await (const part of capabilities.llm.stream({
        messages,
        tools: [...tools.values()],
        signal,
      })) {
        if (part.type === "text-delta") {
          stepText.push(part.text);
          emit({ type: "text-delta", runId, stepIndex, text: part.text });
        } else if (part.type === "tool-call") {
          calls.push({ type: "tool-call", id: part.id, name: part.name, input: part.input });
        } else if (part.type === "finish") {
          finishReason = part.finishReason;
          usage = part.usage;
        }
      }

      text.push(...stepText);
      emit({ type: "step-finished", runId, stepIndex, finishReason });

      if (calls.length === 0) {
        emit({ type: "run-finished", runId, status: "finished", usage });
        return { runId, status: "finished", messages, text: text.join(""), usage };
      }

      const assistantParts: Message["parts"] = [
        ...(stepText.join("") ? [{ type: "text" as const, text: stepText.join("") }] : []),
        ...calls,
      ];
      messages.push({ role: "assistant", parts: assistantParts });

      const results: ToolResultPart[] = [];
      for (const call of calls) {
        emit({
          type: "tool-call",
          runId,
          stepIndex,
          callId: call.id,
          name: call.name,
          input: call.input,
        });
        const tool = tools.get(call.name);
        if (!tool) {
          results.push({
            type: "tool-result",
            callId: call.id,
            name: call.name,
            output: `unknown tool: ${call.name}`,
            isError: true,
          });
          continue;
        }
        if (tool.needsApproval) {
          emit({
            type: "approval-requested",
            runId,
            stepIndex,
            callId: call.id,
            name: call.name,
            input: call.input,
          });
          const decision = await approve(
            { callId: call.id, name: call.name, input: call.input },
            signal ?? new AbortController().signal,
          );
          emit({
            type: "approval-resolved",
            runId,
            callId: call.id,
            approved: decision.approved,
            ...(decision.approved ? {} : { reason: decision.reason }),
          });
          if (!decision.approved) {
            const output = `denied${decision.reason ? `: ${decision.reason}` : ""}`;
            results.push({
              type: "tool-result",
              callId: call.id,
              name: call.name,
              output,
              isError: true,
            });
            emit({
              type: "tool-result",
              runId,
              stepIndex,
              callId: call.id,
              name: call.name,
              output,
              isError: true,
            });
            continue;
          }
        }
        try {
          const output = await tool.execute(
            call.input,
            { runId, stepIndex, capabilities },
            signal ?? new AbortController().signal,
          );
          results.push({ type: "tool-result", callId: call.id, name: call.name, output });
          emit({ type: "tool-result", runId, stepIndex, callId: call.id, name: call.name, output });
        } catch (error) {
          const output = error instanceof Error ? error.message : String(error);
          results.push({
            type: "tool-result",
            callId: call.id,
            name: call.name,
            output,
            isError: true,
          });
          emit({
            type: "tool-result",
            runId,
            stepIndex,
            callId: call.id,
            name: call.name,
            output,
            isError: true,
          });
        }
      }
      messages.push({ role: "tool", parts: results });
    }

    emit({ type: "run-finished", runId, status: "finished" });
    return { runId, status: "finished", messages, text: text.join("") };
  } catch (error) {
    if (signal?.aborted) {
      emit({ type: "run-finished", runId, status: "cancelled" });
      return fail("cancelled", error);
    }
    emit({ type: "run-finished", runId, status: "failed" });
    return fail("failed", error);
  }
}
