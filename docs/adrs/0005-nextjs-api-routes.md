# Next.js API Routes as the Server Layer

## Metadata

- **Status**: Accepted
- **Date**: 2026-05-04
- **Decision makers**: Project owner and contributors

## Context and Problem Statement

Calca requires server-side endpoints to handle client-initiated operations that cannot run in the browser:

- **AI generation** — Streaming HTML/CSS generation via large language models (Claude, Gemini), which requires long-running request/response cycles and server-side SDK calls
- **Project persistence** — Storing and retrieving user projects and design variations
- **Settings management** — User preferences and AI provider configuration
- **Model probing** — Health checks against AI provider endpoints
- **Export** — Format conversion (SVG, Tailwind CSS, React components)

These operations require a server layer. The question is which framework best serves this role.

## Decision Drivers

- **Streaming support** — AI generation pipelines must stream responses to the client in real time
- **Long-running requests** — AI model calls can take 60+ seconds; the server layer must support extended timeouts
- **Deployment alignment** — The application is deployed on Vercel, which natively supports Next.js
- **Minimal migration cost** — The existing codebase already has 8 API routes in production; a framework swap would require a full rewrite with no functional gain
- **Type safety end-to-end** — Shared types between client pages and server routes reduce friction
- **Scalability** — Routes must scale horizontally under concurrent user load

## Considered Options

- **Next.js API Routes** — Built-in route handlers in the Next.js application (`src/app/api/`)
- **Hono standalone server** — A lightweight, runtime-agnostic framework (Node, Bun, Deno) deployed as a separate service
- **tRPC** — End-to-end type-safe RPC layer on top of Next.js API Routes

## Decision Outcome

Chosen option: **"Next.js API Routes"**

Next.js API Routes are the accepted server layer for Calca. All server-side logic — AI pipeline endpoints, project CRUD, settings, export, and model probing — lives in route handlers under `src/app/api/`.

This decision follows evaluation of the Hono standalone server approach (which was explored in a prior investigation and found to offer no functional benefit while requiring a full rewrite) and tRPC (deferred as a future option if the client/server split grows significantly).

### Consequences

- Good: File-based routing is automatic; Next.js discovers routes without manual registration
- Good: Vercel deploys Next.js natively with zero configuration; no adapter layer required
- Good: `maxDuration` export on route handlers extends request timeouts to 300 seconds for long-running AI calls
- Good: `ReadableStream` is natively supported in Next.js route handlers, enabling real-time AI streaming
- Good: AI pipeline logic can be extracted into `packages/core`; the Next.js wrapper remains a thin transport layer
- Good: Type safety is maintained through shared types in `packages/shared`
- Neutral: Routes are coupled to the Next.js application lifecycle; this is acceptable given the Vercel deployment target
- Neutral: tRPC is deferred; revisit if the client/server contract grows in complexity

## Validation

This decision is considered validated when:

- All AI pipeline endpoints (`/api/pipeline/layout`, `/api/pipeline/images`, `/api/pipeline/review`, `/api/pipeline/critique`, `/api/plan`) stream responses successfully to the client
- Long-running AI generation calls complete without triggering Vercel's default 10s timeout (via `maxDuration`)
- Project persistence and settings endpoints return consistent, type-safe responses
- The application builds and deploys on Vercel without adapter configuration
- Streaming latency is within acceptable bounds for interactive AI generation (< 2s to first token)

## More Information

- Existing API routes under `src/app/api/` — pipeline, plan, export, probe-models
- Vercel deployment: Next.js API Routes are natively supported; no additional server configuration required
- AI streaming: handled via `ReadableStream` in route handlers with periodic whitespace pings to prevent Vercel timeouts
- AI pipeline logic: should be progressively extracted into `packages/core` to decouple business logic from the Next.js transport layer

(End of file)
