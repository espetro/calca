# SSE Timeout Strategy for Long-Running Design Pipeline

## Metadata

- **Status**: Accepted
- **Date**: 2026-05-06
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

The Calca design pipeline processes user prompts through sequential AI stages: plan, layout, images, review, and critique. The complete pipeline typically takes 6+ minutes to execute, with streaming updates sent via Server-Sent Events (SSE). However, Bun's HTTP server has an `idleTimeout` configuration that defaults to 30 seconds and has a maximum value of 255 seconds (4.25 minutes).

Non-streaming pipeline stages — specifically the images, review, and critique stages — can produce no HTTP output for 2+ minutes while processing AI calls. During these periods, Bun's `idleTimeout` mechanism incorrectly identifies the SSE connection as idle and closes it, breaking the user experience and causing failed design generations.

The current global server configuration (`idleTimeout: 0`) disables idle timeout entirely, but this is not the optimal approach for production deployments where resource management is critical.

## Decision Drivers

- **Connection reliability** — SSE connections must remain open throughout the 6+ minute pipeline execution
- **Resource management** — Cannot disable idle timeout globally due to security and resource concerns
- **Production readiness** — Solution must work in production environments with proper timeout management
- **Minimal code changes** — Implementation should be simple and not require major refactoring
- **Framework constraints** — Custom heartbeat events injected by the workflow are filtered out by AI-SDK stream transformers, limiting a workflow-level heartbeat option

## Considered Options

- **Increase global idleTimeout** — Set `idleTimeout` to 255 seconds (Bun's maximum). Pros: simple implementation. Cons: still insufficient for 6+ minute pipelines; security implications from disabling timeout for all endpoints; maximum is hard-coded and may be changed in future Bun versions.
- **Per-request timeout disable** — Use `server.timeout(req, 0)` to disable timeout for individual SSE requests. Pros: targeted solution; maintains security for other endpoints; simple implementation. Cons: requires per-request configuration.
- **HTTP-level SSE keep-alive** — Inject `:keep-alive` comments into the SSE stream to maintain connection activity. Pros: works within HTTP specification; no timeout configuration needed; framework-agnostic. Cons: requires stream modification; may need client-side handling.
- **Workflow-level heartbeat** — Inject custom heartbeat events into the SSE stream during non-streaming stages. Pros: maintains connection activity; provides useful debugging information. Cons: requires stream transformer modification; custom events are filtered out by the transformer; additional complexity.

## Decision Outcome

Chosen option: **"HTTP-level SSE keep-alive"**, with per-request timeout disable as a redundant layer where a Bun server instance is reachable from the route handler.

The main-branch server (`apps/server`) wraps the pipeline stream in a transform that injects `:keep-alive` comments every 30 seconds. SSE comments are ignored by event parsers but reset HTTP idle timers, keeping the connection alive through Bun's idle timeout and intermediate proxies (`X-Accel-Buffering: no` already disables proxy buffering).

1. **HTTP-level SSE keep-alive**: `apps/server/src/routes/workflow.ts` wraps the pipeline stream with `withKeepAlive`, injecting `:keep-alive\n\n` every 30 seconds and clearing the timer on done/error/cancel.
2. **Per-request timeout disable** (optional layer): `server.timeout(req.raw, 0)` disables idle timeout for individual SSE requests. The current main-branch server creates the `Bun.serve` instance directly in `index.ts` with `idleTimeout: 0`, so this layer is not wired today; if a server-instance abstraction is reintroduced, per-request timeout should be enabled for SSE endpoints.

This combination ensures the connection remains open at the HTTP protocol level, with server-level timeout control available where needed, providing redundant protection for the SSE-based design pipeline.

### Consequences

- Good: **Production-ready** — Works within HTTP specification and Bun's constraints without global configuration changes
- Good: **Minimal impact** — A single stream transform in the route handler; client-side SSE parsing is unaffected
- Good: **Proxy-friendly** — Keep-alive comments traverse proxies that would otherwise close a quiet connection
- Bad: **Implementation complexity** — The stream transform must correctly clean up its timer on done, error, and consumer cancel to avoid leaking timers
- Bad: **Client-side awareness** — `:keep-alive` comments may need client-side filtering or handling
- Neutral: **Future-proof** — Solution relies on standard HTTP practices and should work with future Bun versions

## Validation

The decision is validated by:

- **Route handler modification**: `apps/server/src/routes/workflow.ts` wraps the `designPipelineStream` output in `withKeepAlive` before returning the SSE response
- **Unit tests**: `apps/server/src/routes/__tests__/keep-alive.test.ts` verifies comment injection at a fast interval, pass-through behaviour, and timer cleanup on error
- **Connection testing**: SSE connections remain open for 6+ minute pipelines with no disconnections due to idle timeout
- **Production deployment**: The solution works in production environments without requiring global configuration changes

## More Information

- Route handler / keep-alive transform: `apps/server/src/routes/workflow.ts`
- Keep-alive tests: `apps/server/src/routes/__tests__/keep-alive.test.ts`
- Current server config: `apps/server/src/index.ts` (global `idleTimeout: 0`)
- HTTP SSE specification: RFC 7238 (Server-Sent Events) and RFC 7239 (Keep-Alive)
