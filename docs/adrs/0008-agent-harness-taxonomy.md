# Agent harness taxonomy & in-house `agent-core` on the AI SDK

## Metadata

- **Status**: Accepted
- **Date**: 2026-09-28
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

Layer 3 needs an in-browser, serverless agent harness (BYOK, keys held client-side). The v-next plan (#37 decision 5) chose "AI SDK behind a small browser-safe `agent-core` with capability injection". A second survey (2026-09-28) re-tested the hypothesis that an off-the-shelf harness — smolagents-like, >100★, maintained — could run the loop in-browser so Calca doesn't maintain one.

Verified findings:

- **`langchain` v1** is now a *passing* candidate: its browser bundle exports `createAgent` + middleware (HITL, retry, summarization, subagents) with zero `node:` imports, provider adapters set `dangerouslyAllowBrowser: true`, MIT, ~18k★, biweekly releases — adoptable at `^1`.
- **`@tanstack/ai`** is philosophically closest (isomorphic tools, approval flow, `defineByok` keyring, Standard Schema) but is `0.x` (~93 releases/10mo) and its adapters are server-side — BYOK currently routes keys through a relay over `x-byok-*` headers.
- smolagents has **no JS distribution** (Python only; HF's JS answer `@huggingface/tiny-agents` is a Node MCP CLI). `agentic` and `LlamaIndex.TS` repos are **archived**. VoltAgent / AgentKit / KaibanJS / ADK-JS / beeai / genkit / Claude Agent SDK are all Node/server-side by verified dep tree.

## Decision Drivers

- **Browser-only, no server** — no `node:*` deps in the shipped bundle; BYOK keys never leave the client.
- **Lean layers** — layer 2's charter is Web-Standards-only on any ECMAScript runtime; minimal dependencies.
- **Don't maintain a harness you don't have to** — but what Calca uniquely needs (capability injection, canvas-tool wiring, approval UX, multiplayer event fan-out) is domain logic no harness ships.
- **Swappability** — if a harness is adopted later, the taxonomy should already map 1:1.

## Considered Options

- **Adopt `langchain@^1`** — Verified browser-safe full harness. Cost: second provider stack beside the AI SDK, LangGraph conceptual surface, `langsmith` in the client bundle, weight.
- **Adopt `@tanstack/ai`** — Closest design match. Blocked today: 0.x breaking cadence and server-side adapters (documented BYOK path requires a relay).
- **In-house `@calca/agent-core` on AI SDK** — Keep loop + approvals + event stream ours (~few hundred LOC over `streamText`); provider churn stays absorbed by `ai`. Common vocabulary so either candidate slots in behind the same seam later.

## Decision Outcome

Chosen option: **In-house `@calca/agent-core` on the AI SDK, with the shared taxonomy.**

The delta a harness would own is thin (loop, tool dispatch, approval pauses); the delta it would drag in is thick (second provider stack / relay / graph runtime). The package's names deliberately mirror LangChain + TanStack AI terms — `AgentSpec`/`Run`/`Step`/`Tool`/`toolDefinition`/`ToolCall`/`Approval`/`ModelPort`/`RunEvent`/`Capabilities` — see the mapping table in `packages/agent-core/README.md`. Migration cost later is bounded: map capabilities → tools/middleware, swap `ModelPort` for the harness's adapter call.

**Re-evaluation gates** (tracked on #41):

- **G2 — Phase 4/5 boundary**: check `@tanstack/ai` for 1.0 + documented direct-browser adapters; check `langchain` `^1` minor stability since 1.5.x.
- **G3 — Phase 6, before format/plugin API freeze**: final adopt decision — if TanStack AI ≥1.0 with client-side adapters, or the roadmap needs checkpointing/sub-agent graphs, adopt behind `@calca/agent-core`'s contracts.
- **Continuous trigger**: adopt `langchain@^1` immediately if agent-core grows past ~1k LOC or needs durable sessions / branching sub-agent trees.
