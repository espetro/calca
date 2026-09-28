import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { Capabilities } from "./capabilities.js";

/**
 * Tool vocabulary shared by TanStack AI (`toolDefinition` + approval flow),
 * LangChain (`tool()` + HITL middleware) and the AI SDK (`tool()`).
 *
 * `Tool` is executor-side: the loop — never the provider adapter — invokes
 * `execute`, so approvals and capability injection stay ours.
 */
export interface Tool<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  /** Standard Schema (zod, valibot, arktype) or plain JSON-schema-shaped object. */
  inputSchema: StandardSchemaV1<Input> | Record<string, unknown>;
  outputSchema?: StandardSchemaV1<Output>;
  /** When true, the run pauses for an Approval before `execute` runs. */
  needsApproval?: boolean;
  execute: (input: Input, ctx: ToolContext, signal: AbortSignal) => Promise<Output> | Output;
}

export type ToolContext = {
  runId: string;
  stepIndex: number;
  capabilities: Capabilities;
};

export const toolDefinition = <Input, Output>(def: Tool<Input, Output>): Tool<Input, Output> => def;
