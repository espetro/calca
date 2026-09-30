# @calca/agent-core

The harness **seam** for Calca's in-browser, no-server, BYOK agent runs
(Layer 3, issue #41).

Deliberately thin: the package owns the interface (`AgentHarness`, `AgentSpec`,
`Capabilities`, `HarnessRunInput`) and ships one implementation —
`aiSdkHarness`, backed by the AI SDK's `ToolLoopAgent`. The loop, tool
execution, approval requests, step limits and abort are all AI SDK behaviour;
we only name the contract the app codes against.

```ts
const harness = aiSdkHarness();

for await (const part of harness.stream({
  agent: { name: "designer", instructions, tools },
  model, // any AI SDK LanguageModel (BYOK providers)
  messages, // ModelMessage[]
  capabilities, // injected into each tool's execute() via `toolsContext`
  signal, // AbortSignal
})) {
  // AI SDK TextStreamPart: text-delta, tool-call, tool-result,
  // tool-approval-request, start-step/finish-step, finish, abort, error
}
```

## Why this shape

A 2026-09-28 survey (issue #41 gates, ADR 0008) found `langchain@^1` is the
only verified browser-safe BYOK harness and `@tanstack/ai` the closest design
match (still 0.x, server-side adapters). Both stay **swappable** as long as
the contract names things the way they do:

| agent-core              | LangChain / LangGraph                   | TanStack AI             |
| ----------------------- | --------------------------------------- | ----------------------- |
| `AgentSpec`             | `createAgent(...)` args                 | `defineAgent`           |
| `AgentHarness.stream`   | `agent.stream` / LangGraph `streamMode` | `chat()` / `ChatClient` |
| `HarnessRunInput.model` | `BaseChatModel`                         | provider adapter        |
| `TextStreamPart` stream | LangGraph stream events                 | AG-UI event stream      |
| `Capabilities`          | runtime context                         | runtime context         |
| tool `needsApproval`    | `humanInTheLoopMiddleware`              | approval flow           |

To swap later: implement `AgentHarness` over the new harness emitting the
same `TextStreamPart` shapes; nothing above this package changes.

## Rules

- Browser-safe: no `node:*`, Bun or Electrobun imports.
- All tool I/O goes through `Capabilities` (forwarded via `toolsContext`), never
  globals or ambient state.
- Stay thin — the stream contract is AI SDK's `TextStreamPart`; add
  agent-core vocabulary only where the SDK has no name for it.

## Deps

`ai` — the only runtime dependency (`@ai-sdk/provider` is a devDep for
mock-model test types).
