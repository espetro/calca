/**
 * Run lifecycle + event stream (AG-UI-flavoured): the single wire format
 * the UI renders and multiplayer relays. Keeps one `Run` per ledger entry,
 * matching the Phase-3 objects model.
 */
import type { TokenUsage } from "./capabilities.js";

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting-approval"
  | "finished"
  | "failed"
  | "cancelled";

export type RunEvent =
  | { type: "run-started"; runId: string }
  | { type: "text-delta"; runId: string; stepIndex: number; text: string }
  | {
      type: "tool-call";
      runId: string;
      stepIndex: number;
      callId: string;
      name: string;
      input: unknown;
    }
  | {
      type: "tool-result";
      runId: string;
      stepIndex: number;
      callId: string;
      name: string;
      output: unknown;
      isError?: boolean;
    }
  | {
      type: "approval-requested";
      runId: string;
      stepIndex: number;
      callId: string;
      name: string;
      input: unknown;
    }
  | { type: "approval-resolved"; runId: string; callId: string; approved: boolean; reason?: string }
  | { type: "step-finished"; runId: string; stepIndex: number; finishReason: string }
  | {
      type: "run-finished";
      runId: string;
      status: "finished" | "failed" | "cancelled";
      usage?: TokenUsage;
    };
