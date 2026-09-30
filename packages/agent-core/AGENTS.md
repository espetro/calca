# @calca/agent-core — agent notes

Contract seam between the app and whichever agent loop backs it. AI SDK
(`ToolLoopAgent`) is the only implementation today; keep the surface
LangChain/TanStack-shaped so a gate decision (issue #41) can swap it.

## Hard rules

- **Browser-safe**: no `node:*`, Bun, Electrobun or fs imports.
- **Interface-first**: object shapes are `interface`; unions stay `type`.
- **No harness logic here**: loop, approvals, retries live in the impl. If
  you're writing a loop, stop — it belongs in the harness.
- All tool I/O via `Capabilities` → the tool `context` option (`toolsContext`); never globals.
- New vocabulary must map to a LangChain or TanStack name (see README table).

## Layout

| File                  | Purpose                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| `src/harness.ts`      | The contract: `AgentHarness`, `AgentSpec`, `Capabilities`, `HarnessRunInput` |
| `src/ai-sdk.ts`       | `aiSdkHarness` — `ToolLoopAgent` adapter                                     |
| `src/harness.test.ts` | Mock-model tests via `ai/test` `MockLanguageModelV4`                         |
