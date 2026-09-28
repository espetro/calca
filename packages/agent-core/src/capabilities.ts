/**
 * Capability injection (pi's env pattern, applied to the browser):
 * the core loop owns no IO. Every platform supplies concrete ports —
 * the web app supplies IndexedDB/OPFS + fetch implementations, the CLI
 * and desktop supply Node fs/shell ones.
 */
export interface ModelPort {
  /** One model call; streams parts back. Non-streaming impls may emit a single text part. */
  stream: (request: ModelRequest) => AsyncIterable<ModelStreamPart>;
}

export type ModelRequest = {
  messages: import("./messages.js").Message[];
  tools?: import("./tool.js").Tool[];
  signal?: AbortSignal;
};

export type ModelStreamPart =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; id: string; name: string; input: unknown }
  | { type: "finish"; finishReason: string; usage?: TokenUsage };

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export interface StoragePort {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface SecretPort {
  /** Resolves a BYOK provider key held client-side; never logged. */
  resolve: (ref: string) => Promise<string | null>;
}

/** Canvas mutation surface given to format/screen tools. Defined by the host. */
export type CanvasPort = Record<string, unknown>;

export type Capabilities = {
  /** Required: the provider-model port (AI SDK adapter ships at `@calca/agent-core/ai-sdk`). */
  llm: ModelPort;
  canvas?: CanvasPort;
  storage?: StoragePort;
  secrets?: SecretPort;
  skills?: Record<string, unknown>;
  commands?: Record<string, unknown>;
  mcp?: Record<string, unknown>;
};
