import type { Capabilities } from "./capabilities.js";
import type { Message } from "./messages.js";
import type { Tool } from "./tool.js";

/**
 * Agent spec — the configured entity that produces Runs.
 * (LangChain `createAgent` args, TanStack `defineAgent`, pi `Agent`.)
 */
export type AgentSpec = {
  name: string;
  /** System instructions; format skills compose these. */
  instructions?: string;
  tools?: Tool[];
  /** Hard cap on model calls per run. Default: 16. */
  maxSteps?: number;
};

export type RunInput = {
  agent: AgentSpec;
  messages: Message[];
  capabilities: Capabilities;
  signal?: AbortSignal;
  /** Subscriber for the run's event stream (UI, ledger, multiplayer relay). */
  onEvent?: (event: import("./events.js").RunEvent) => void;
  /** Resolves tool calls whose `needsApproval` is set. Default: deny-all. */
  approve?: import("./interrupt.js").ApprovalHandler;
};

export type RunResult = {
  runId: string;
  status: "finished" | "failed" | "cancelled";
  /** Full transcript including tool results, appendable to `messages` for the next run. */
  messages: Message[];
  text: string;
  usage?: import("./capabilities.js").TokenUsage;
  error?: unknown;
};
