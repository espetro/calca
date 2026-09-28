# packages/agent-core/AGENTS.md — Agent harness

> In-browser agent loop + contracts. See root [AGENTS.md](../../AGENTS.md) for universal rules.

## Package Purpose

`@calca/agent-core` is the browser-safe harness for Layer 3: run loop, tool
dispatch, human-in-the-loop approvals, capability injection, and the
`RunEvent` stream. It must stay lean — one runtime dep
(`@standard-schema/spec`), optional `ai` peer for `./ai-sdk`.

## Hard rules

- **Browser-safe**: no `node:*`, `bun`, or `electrobun` imports in `src/`. The
  browser-bundle CI check (Phase 3, #41) will enforce this — don't break it.
- **The loop is the only tool executor.** Never give adapters `execute`
  functions — approvals would be bypassable.
- **All IO goes through `Capabilities` ports** (`llm`, `canvas`, `storage`,
  `secrets`, `skills`, `commands`, `mcp`). No fetch/fs/store calls inside the
  loop.
- **One `RunEvent` union** in `events.ts` is the UI + multiplayer wire format;
  extend it additively.
- **Taxonomy is contractual**: names map to LangChain/TanStack AI (see README
  table + ADR 0008). Renames are breaking changes — don't do them casually.

## Layout

| File              | Contents                                                               |
| ----------------- | ---------------------------------------------------------------------- |
| `messages.ts`     | `Message`, `MessagePart`, `ToolCallPart`, `ToolResultPart`             |
| `tool.ts`         | `Tool`, `toolDefinition`, `ToolContext`                                |
| `capabilities.ts` | `Capabilities`, `ModelPort`, `StoragePort`, `SecretPort`, `CanvasPort` |
| `events.ts`       | `RunEvent`, `RunStatus`                                                |
| `interrupt.ts`    | `ApprovalRequest/Decision/Handler`                                     |
| `agent.ts`        | `AgentSpec`, `RunInput`, `RunResult`                                   |
| `loop.ts`         | `runAgent` — the loop                                                  |
| `ai-sdk.ts`       | `aiSdkModel` adapter (`ai` peer)                                       |

## Testing

`bun run test` — `loop.test.ts` scripts a fake `ModelPort`; add cases there for
any loop change (deny-path, abort, unknown tool, maxSteps cap).
