# @calca/mcp-core

Pure, runtime-neutral half of Calca's Layer-2 agent playground: canvas tool
implementations over [`@calca/canvas-base`](../canvas-base), protocol types, and
the single-source tool contract that generates MCP tool JSON Schemas and docs.

No Node APIs, no MCP SDK wiring — the `calca` CLI (`@calca/mcp`) binds this
surface to stdio transports.

## Surface

| Tool             | Effect                                                        |
| ---------------- | ------------------------------------------------------------- |
| `canvas.read`    | `summary` / `viewport` / `selection` / `full` reads           |
| `canvas.propose` | **Default** mutation mode — records a proposal, never mutates |
| `canvas.apply`   | Lands commands (or a proposal) with `origin: 'agent'`         |
| `canvas.lease`   | Exclusive soft leases, ttl clamped to 30 s                    |
| `canvas.release` | Early lease release                                           |
| `canvas.comment` | `type: 'comment'` shape record pointing at a target           |
| `canvas.arrange` | `row` / `column` / `grid` layout via `props.position` updates |

```ts
import { createCanvasSession, callTool } from "@calca/mcp-core";

const session = createCanvasSession({ agentId: "claude-code" });
await callTool(session, "canvas.apply", { commands, requestId: "req-1" });
```

Semantics: every mutation returns `{applied, commands, affected, requestId}`;
errors are `{error: {code, message}}` (`duplicate` | `leased` | `op-limit` |
`invalid` | `not-found`). Request IDs are idempotency keys — a replay is a
no-op. Ops are bounded to `MAX_OPS_PER_CALL` (100) per call.

Scaffolds pinned for later phases: `src/wire` (Phase 3, #41), `src/crypto`
envelope crypto (Phase 4, #42).
