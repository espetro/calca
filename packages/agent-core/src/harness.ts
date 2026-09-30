import type { LanguageModel, ModelMessage, TextStreamPart, ToolSet } from "ai";

/**
 * Static agent definition.
 * Maps to LangChain `createAgent` args / TanStack `defineAgent`.
 */
export interface AgentSpec {
  name: string;
  instructions?: string;
  tools?: ToolSet;
  /** Cap on model steps per run (default 16). */
  maxSteps?: number;
}

export interface StoragePort {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

/** BYOK: resolves user-held keys client-side; values must never reach a server. */
export interface SecretPort {
  resolve(name: string): string | undefined;
}

/**
 * Host-provided capabilities, injected per run and visible to every tool's
 * `execute` via the tool `context` option. Concrete shapes are owned by the
 * layers: `canvas` by the canvas lib, `storage`/`secrets` by the host app;
 * `skills`/`commands`/`mcp` are desktop-only slots.
 */
export interface Capabilities {
  canvas?: unknown;
  storage?: StoragePort;
  secrets?: SecretPort;
  skills?: unknown;
  commands?: unknown;
  mcp?: unknown;
}

export interface HarnessRunInput {
  agent: AgentSpec;
  /** Maps to LangChain `BaseChatModel` / a TanStack AI adapter. */
  model: LanguageModel;
  messages: ModelMessage[];
  capabilities?: Capabilities;
  signal?: AbortSignal;
}

/**
 * The seam the app codes against. `aiSdkHarness` is the only implementation
 * today; a LangChain or TanStack implementation later only has to emit the
 * same AI-SDK-shaped parts — the union covers text deltas, tool
 * calls/results/errors, approval requests and denials, step and run
 * boundaries, abort and error.
 */
export interface AgentHarness {
  stream(input: HarnessRunInput): AsyncIterable<TextStreamPart<ToolSet>>;
}
