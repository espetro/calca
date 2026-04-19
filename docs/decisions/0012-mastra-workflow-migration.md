# 0012 — Mastra Workflow Migration

| Attribute | Value |
|-----------|-------|
| Status | **Accepted** |
| Date | 2026-04-19 |
| Decision | Adopt Mastra.ai workflows for AI pipeline orchestration |

## Context

MADR 0009 (2026-04-05) rejected Mastra AI framework in favor of direct SDK calls with a shared `packages/core` package. MADR 0008 documented the POC attempt with a REDESIGN verdict.

This decision reverses MADR 0009 based on new information about Mastra's capabilities and the project's evolving needs.

## Decision

**We WILL adopt Mastra.ai workflows for the AI design pipeline.**

The pipeline will be restructured as a server-side Mastra workflow within the Next.js app, replacing the client-side orchestration in `use-generation-pipeline.ts`.

## Rationale

### Addressing MADR 0009 Rejection Points

MADR 0009 rejected Mastra for 4 reasons. Each is now addressable:

#### 1. "Pipeline is simple sequential steps"

**Previous thinking**: The pipeline was 4 sequential steps with no branching — too simple for a workflow framework.

**Current reality**: The pipeline has grown in complexity:
- Quick mode vs sequential mode (branching logic)
- Critique loop (frame N receives feedback from frame N-1)
- Abort support (client can cancel mid-generation)
- Remix/revision mode (existing HTML + new prompt)
- Concurrent generation handling (multiple simultaneous requests)
- Image generation with fallback chain (Unsplash → DALL-E → Gemini)

Mastra's workflow primitives (`createWorkflow`, `createStep`, `.branch()`) cleanly express this complexity.

#### 2. "Non-LLM steps (images) can't use Mastra"

**Previous thinking**: Mastra is an LLM agent framework — image generation (Unsplash API, DALL-E, Gemini) isn't an LLM call.

**Current reality**: Mastra's `createStep` executes arbitrary TypeScript code. The image step calls `generateImages()` from `packages/core/src/pipeline/images.ts` exactly as before — no framework restriction on non-LLM operations.

#### 3. "Bundle size"

**Previous thinking**: Mastra adds 500+ KB of framework overhead.

**Current reality**: We only use `@mastra/core/workflows` (workflow + step primitives). No agents, no memory, no RAG, no observability stack. The bundle impact is minimal for server-side usage.

#### 4. "Testing complexity"

**Previous thinking**: Mastra agents are harder to test than plain functions.

**Current reality**: Mastra steps are plain async functions with typed I/O. Each step's `execute()` function is independently testable — more testable than the current 845-line client hook that mixes UI state with orchestration logic.

### Additional Benefits

1. **Observability**: Built-in step tracing and debugging without custom infrastructure
2. **Type safety**: Strongly typed step I/O via Zod schemas
3. **Streaming**: `writer` object for real-time progress to client
4. **Error handling**: Step-level retries and workflow-level error recovery
5. **Separation of concerns**: UI logic stays client-side, orchestration moves server-side

## Implementation

### Architecture

```
Client (React) → POST /api/workflow → Mastra Workflow → Steps → AI SDK
```

### Workflow Steps

1. **plan** — Concept planning
2. **layout** — HTML/CSS generation (streaming)
3. **images** — Image generation (non-LLM)
4. **review** — Visual QA
5. **critique** — Improvement feedback
6. **summary** — Final summary

### Branching

- **Quick mode**: All frames run in parallel
- **Sequential mode**: Frames run sequentially with critique loop

## Consequences

### Positive
- Clean separation between UI and orchestration
- Built-in observability and debugging
- Typed step I/O prevents runtime errors
- Steps are independently testable
- Streaming support without custom ping keepalive

### Negative
- Additional dependency (`@mastra/core`)
- Zod v4 requires `skipLibCheck: true` for Mastra types
- Learning curve for team members
- Vercel serverless timeout risk (mitigated via heartbeat events)

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Keep current client-side orchestration | REJECTED — 845-line hook is unmaintainable |
| Custom workflow engine | REJECTED — Reinventing Mastra's primitives |
| LangGraph | SKIP — Heavier than Mastra for this use case |
| AI SDK-only (no Mastra) | REJECTED — Missing orchestration abstractions |

## References

- MADR 0008: `docs/decisions/0008-poc-mastra-ai.md` — POC attempt
- MADR 0009: `docs/decisions/0009-v2-mastra-workflows-over-effect.md` — Previous rejection
- Plan: `.sisyphus/plans/mastra-pipeline.md` — Implementation plan

## Open Questions

1. **Bundle size in edge functions** — Monitor if Mastra impacts edge deployment
2. **Vercel timeout** — Test with realistic generation loads
3. **Observability setup** — Future task: configure Mastra tracing/dashboards
