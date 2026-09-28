/**
 * Conversation vocabulary shared by LangChain (BaseMessage/ToolMessage),
 * TanStack AI (model messages) and the Vercel AI SDK (ModelMessage).
 */
export type Role = "system" | "user" | "assistant" | "tool";

export type ToolCallPart = {
  type: "tool-call";
  /** Stable id assigned by the model/provider, e.g. `call_abc123`. */
  id: string;
  name: string;
  input: unknown;
};

export type ToolResultPart = {
  type: "tool-result";
  /** Mirrors {@link ToolCallPart.id} this result answers. */
  callId: string;
  name: string;
  output: unknown;
  isError?: boolean;
};

export type MessagePart = { type: "text"; text: string } | ToolCallPart | ToolResultPart;

export type Message = {
  role: Role;
  parts: MessagePart[];
};

export const textMessage = (role: Role, text: string): Message => ({
  role,
  parts: [{ type: "text", text }],
});
