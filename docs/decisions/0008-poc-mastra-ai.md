# 0008 — POC: Mastra AI Framework over Direct SDK Calls

| Attribute | Value |
|-----------|-------|
| Status | **REDESIGN** (POC verdict) |
| Date | 2026-04-05 |
| Decision | Attempted, recommend extracting pipeline logic into shared package instead |

## Context

The current AI implementation makes direct SDK calls across 8 API routes:

### Direct SDK Usage

| Route | SDK | Purpose |
|-------|-----|---------|
| `pipeline/layout` | `@anthropic-ai/sdk` | Streaming HTML generation |
| `pipeline/images` | `@google/genai` + fetch (Unsplash/DALL-E) | Image generation with fallback chain |
| `pipeline/review` | `@anthropic-ai/sdk` | Visual QA review |
| `pipeline/critique` | `@anthropic-ai/sdk` | Design critique feedback |
| `plan` | `@anthropic-ai/sdk` | Concept planning |
| `export` | `@anthropic-ai/sdk` | Format conversion (Tailwind/React) |
| `probe-models` | `@anthropic-ai/sdk` | Model availability check |

### Current Pipeline Flow
```
Plan (Claude) → Layout (Claude, stream) → Images (multi-source) → Review (Claude) → Critique (Claude)
```

Each step:
1. Receives JSON input from client
2. Calls AI SDK directly
3. Parses/transforms response
4. Returns JSON to client

The POC attempted to wrap this with **Mastra** — an AI agent framework.

## Decision

**Redesign.** Skip Mastra but extract pipeline logic into a shared `packages/core` module.

## Rationale for Attempting Mastra

1. **Agent abstraction** — Mastra provides workflow orchestration, tool use, memory
2. **Model switching** — Abstracted model interface (swap Claude/Gemini without code changes)
3. **Workflow DAG** — Visual pipeline definition instead of chained fetch calls
4. **Built-in retries** — Automatic retry on AI API failures
5. **Observability** — Built-in logging/tracing of AI calls

## Rationale Against Mastra

1. **Over-abstraction** — The current pipeline is 4 sequential steps with clear data flow. A DAG framework adds complexity without value
2. **Model-specific features used** — Claude's streaming, vision (image blocks), and system prompts are used directly. Mastra would need custom adapters for each
3. **Image pipeline is multi-vendor** — Unsplash API + DALL-E API + Gemini image gen aren't LLM calls. Mastra doesn't abstract these
4. **Streaming complexity** — `pipeline/layout` streams whitespace pings via `ReadableStream` to avoid Vercel timeout. This is infrastructure-level, not AI-level
5. **Prompt engineering is the IP** — The system prompts (in `settings-modal.tsx`, ~600 lines) and generation prompts (in `pipeline/layout/route.ts`, ~170 lines) are the core value. Mastra doesn't help with prompt engineering
6. **Dependency risk** — Mastra is newer, less battle-tested than direct SDK calls

## Current AI Logic Worth Preserving

### Prompt Engineering (Core IP)

Three design presets with detailed typography, spacing, color, and component rules:
1. **UI/UX Designer** — App interfaces, dashboards, component systems
2. **Marketing Website** — Landing pages, hero sections, conversion flows
3. **Brand/Ad Design** — Social media ads, display banners

Each preset includes:
- Font stacks and typography scales
- Spacing systems (4px base unit)
- Color palettes (neutral scale + functional + brand)
- Component patterns (buttons, inputs, cards, tables)
- Accessibility requirements (WCAG AA, touch targets)
- Anti-patterns ("DON'T" rules)

### Pipeline Orchestration (Working)

- **Sequential critique loop** — Frame N uses critique from Frame N-1
- **Quick parallel mode** — All frames simultaneously
- **Fallback chain** — Image generation tries Unsplash → DALL-E → Gemini
- **Base64 stripping** — Remove/reinsert images to avoid payload limits
- **HTML parsing** — Extract size hints, Otto comments, clean markdown fences
- **Revision mode** — Edit existing design vs create new

## Recommended Approach for v2

### Extract to `packages/core`

```typescript
// packages/core/src/pipeline/
//   plan.ts          — Concept planning logic + prompts
//   layout.ts        — HTML generation logic + prompts
//   images.ts        — Image generation + fallback chain
//   review.ts        — Visual QA logic + prompts
//   critique.ts      — Critique logic + prompts
//   parse.ts         — HTML parsing, size extraction, cleanup
//   prompts.ts       — All system prompts + prompt builders

// packages/core/src/providers/
//   claude.ts        — Claude SDK wrapper (streaming, vision)
//   gemini.ts        — Gemini SDK wrapper (image gen)
//   unsplash.ts      — Unsplash API wrapper
//   dalle.ts         — DALL-E API wrapper
```

### Benefits
1. **Testable** — Unit test prompts and parsing without HTTP
2. **Reusable** — Same logic works in Next.js API routes, CLI, desktop server
3. **Model-agnostic interface** — Define `LLMProvider` interface, implement for each provider
4. **No framework lock-in** — Plain functions, easy to compose

## Consequences

### Positive
- Pipeline logic becomes testable and reusable
- CLI and desktop can use same AI pipeline
- No dependency on Mastra's API stability
- Direct SDK access for model-specific features

### Negative
- Must write own retry/error handling (Mastra provides this)
- Must manage own provider abstraction layer
- No built-in observability/tracing

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Mastra framework | REDESIGN → extract logic without framework |
| Direct SDK calls (current) | CARRY — works but tightly coupled to routes |
| AI SDK (Vercel) | CONSIDER — lighter than Mastra, good streaming support |
| LangChain | SKIP — even heavier than Mastra for this use case |
| Custom `packages/core` extraction | CARRY — right level of abstraction |
