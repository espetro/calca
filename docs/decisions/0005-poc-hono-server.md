# 0005 — POC: Hono Server over Next.js API Routes

| Attribute | Value |
|-----------|-------|
| Status | **SKIP** (POC verdict) |
| Date | 2026-04-05 |
| Decision | Attempted migration, recommend keeping Next.js API routes |

## Context

The original Gosto uses 8 Next.js API routes under `src/app/api/`:
- `pipeline/layout` — Streaming HTML generation via Claude (350 lines)
- `pipeline/images` — Multi-source image generation (Unsplash/DALL-E/Gemini)
- `pipeline/review` — Visual QA with Claude
- `pipeline/critique` — Design critique for iterative improvement
- `plan` — Concept planning
- `generate` — Legacy generation
- `export` — Format conversion (SVG/Tailwind/React)
- `probe-models` — Model availability check

The POC attempted to migrate these to a standalone **Hono** server at `apps/server/`.

## Decision

**Skip Hono.** Keep Next.js API routes. The migration would require rewriting all 8 endpoints with no functional benefit.

## Rationale for Attempting

1. **Framework independence** — Hono works with any runtime (Node, Bun, Deno, edge)
2. **Better streaming** — Hono has first-class streaming support (ReadableStream)
3. **Desktop use case** — Electrobun could run Hono locally without Next.js overhead
4. **Testing** — Hono routes are easier to unit test than Next.js route handlers

## Rationale for Skipping

1. **Next.js streaming already works** — `pipeline/layout/route.ts` already uses `ReadableStream` with periodic pings to avoid Vercel timeout. This is a solved problem
2. **Zero functional benefit** — The same Claude/Gemini SDK calls work identically in both frameworks
3. **Deployment alignment** — Vercel deploys Next.js natively. Hono on Vercel requires adapter
4. **File-based routing** — Next.js API routes auto-discover. Hono requires manual route registration
5. **`maxDuration` works** — Next.js route exports `maxDuration = 300` for long-running AI calls

## What Works in Current Next.js Approach

- **Streaming** — `pipeline/layout` streams whitespace pings then final JSON, keeping Vercel alive
- **Timeout handling** — `maxDuration = 300` on AI-heavy routes
- **Base64 handling** — Routes strip/restore base64 images to avoid Vercel's 4.5MB body limit
- **Error handling** — Consistent error response pattern across all routes
- **Type safety** — Shared types between page and routes via `@/lib/types`

## Consequences

### For v2
- **Keep Next.js API routes** as the server layer
- If desktop needs a local server, wrap the same route handlers in a minimal Express/Hono adapter
- Extract AI pipeline **logic** into `packages/core` — the framework wrapper (Next.js vs Hono) becomes a thin layer

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Hono standalone server | SKIP — rewrite with no benefit |
| Next.js API routes (current) | CARRY — works, deployed, streaming solved |
| tRPC for type-safe routes | REDESIGN — consider for v2 if client/server split grows |
| Hono as local-only server for desktop | VIABLE — for desktop packaging only |
