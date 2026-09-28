# @calca/agent-core

Calca's in-browser agent harness: a thin, browser-safe loop + contracts that own
capability injection, tool dispatch, approvals and the run event stream.
Provider calls go through a `ModelPort`; the Vercel AI SDK adapter ships at
`@calca/agent-core/ai-sdk` (`ai` is an optional peer dependency).

Browser-safe: no `node:*` imports, no required backend — BYOK keys stay
client-side behind the `SecretPort`.

## Dependencies

One runtime dep: `@standard-schema/spec` (types only — lets `inputSchema`
accept zod/valibot/arktype). `ai` is an optional peer used only by the
`./ai-sdk` subpath.

## Taxonomy ↔ ecosystem map

Names here intentionally track the common vocabulary so a LangChain
(`langchain@^1`) or TanStack AI (`@tanstack/ai`) harness can later be dropped
in behind the same seam — see ADR `docs/adrs/0008-agent-harness-taxonomy.md`
and the re-evaluation gates on issue #41.

| agent-core                          | LangChain.js v1                    | TanStack AI                            | AI SDK                          |
| ----------------------------------- | ---------------------------------- | -------------------------------------- | ------------------------------- |
| `AgentSpec`                         | `createAgent({...})`               | `defineAgent`                          | `ToolLoopAgent` settings        |
| `runAgent` → `Run`                  | agent invocation                   | `chat()` / run                         | `generate`/`stream` call        |
| `RunResult.messages` (transcript)   | message state                      | `messages`                             | `messages`                      |
| `Step` (loop iteration)             | super-step                         | —                                      | `step` (`stopWhen`)             |
| `Tool` / `toolDefinition`           | `tool()` / `DynamicStructuredTool` | `toolDefinition`                       | `tool()`                        |
| `ToolCall` / `ToolResultPart`       | `ToolCall` / `ToolMessage`         | tool call part                         | `tool-call`/`tool-result` parts |
| `needsApproval` + `ApprovalHandler` | `humanInTheLoopMiddleware`         | tool approval flow / `defineInterrupt` | `needsApproval` on tools        |
| `ModelPort`                         | `BaseChatModel`                    | provider adapter                       | `LanguageModel`                 |
| `RunEvent` stream                   | `streamMode` events / `interrupt`  | run event stream (AG-UI)               | `fullStream` parts              |
| `Capabilities` (env injection)      | runtime/context                    | server/client tool impls               | tool `execute` ctx              |

## Usage sketch

```ts
import { runAgent, toolDefinition, textMessage } from "@calca/agent-core";
import { aiSdkModel } from "@calca/agent-core/ai-sdk";

const result = await runAgent({
  agent: { name: "screen", instructions: "...", tools: [/* format tools */] },
  messages: [textMessage("user", prompt)],
  capabilities: {
    llm: aiSdkModel(openai("gpt-5.2")),
    canvas: canvasPort,
    secrets: secretPort, // BYOK, client-side only
  },
  approve: async (req) => showApprovalDialog(req), // UI confirms mutating tools
  onEvent: (e) => ledger.push(e),
  signal: abortController.signal,
});
```

## Design rules

- The loop is the **single tool executor** — adapters never run tools, so
  approvals and capability injection can't be bypassed.
- Everything IO is a capability port (`llm`, `canvas`, `storage`, `secrets`,
  optional `skills`/`commands`/`mcp`): web supplies browser impls, CLI/desktop
  supply Node impls (pi's env pattern).
- One `AbortSignal` per run; one `RunEvent` union as the UI/multiplayer wire.
- Keep it lean: no framework, no store, no telemetry. If it grows past ~1k LOC
  or needs durable state/graphs, that's the trigger to adopt `langchain@^1`
  behind this same contract surface.
