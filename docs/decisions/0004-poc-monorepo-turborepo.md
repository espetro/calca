# 0004 — POC: Monorepo with Turborepo

| Attribute | Value |
|-----------|-------|
| Status | **CARRY** (reversed from SKIP) |
| Date | 2026-04-05 |
| Reversed | 2026-04-12 |
| Decision | Originally abandoned mid-implementation; reversed — Turborepo now active |

## Context

The original Gosto (Otto Canvas) is a single Next.js app with everything in `src/`. As features grew (multi-model pipeline, comments, export, canvas), the single 1,700-line page component and 8 API routes became difficult to maintain.

The POC attempted to decompose into a Turborepo monorepo with:
- `apps/server/` — Hono backend
- `apps/web/` — Vite + TanStack Router SPA
- `apps/cli/` — CLI tool
- `apps/landing/` — Marketing site
- `packages/core/` — AI-agnostic logic
- `packages/database/` — Drizzle + SQLite
- `packages/types/` — Shared types
- `packages/logger/` — Shared logging
- `platforms/desktop/` — Electrobun shell

## Decision

**Reversal Note (2026-04-12):** This decision was reversed. A `turbo.json` now exists at the repo root with active task pipelines (build, dev, typecheck, test, lint, format, validate, clean). Turborepo is actively used for build orchestration and caching. The original SKIP rationale below is preserved as historical context.

**Original Decision (SKIP):** Only `node_modules/` directories remain in the POC structure — source code was stripped. No `turbo.json` was ever created at the root, indicating Turborepo was never configured.

## Rationale for Attempting

1. **Shared types** — Types defined in `src/lib/types.ts` are duplicated between page and API routes
2. **Separable concerns** — AI pipeline logic is independent of canvas rendering
3. **Desktop target** — Electrobun needs its own entry point
4. **CI/CD optimization** — Turborepo's caching would speed up builds

## Rationale for Skipping

1. **Premature decomposition** — The app isn't large enough to justify monorepo overhead. 11 components, 5 hooks, 8 API routes is manageable in a single Next.js app
2. **No incremental path** — The POC tried to decompose everything at once. A successful monorepo migration extracts one package at a time
3. **Bun runtime risk** — Switching from Node.js to Bun adds uncertainty. Vercel deployment uses Node.js
4. **Missing turbo.json** — Turborepo was never configured, suggesting the build pipeline was never operational
5. **Dependency bloat** — Each package has its own `node_modules/`, multiplying disk usage with no proven benefit

## Consequences

### Positive (of skipping)
- Maintains working Vercel deployment path
- No build system complexity
- Faster iteration on features
- Single `package.json` to manage

### Negative (of skipping)
- Types remain coupled between frontend and API routes
- No shared package for potential future SDK consumers
- Desktop app needs separate build process regardless

### For v2
- **Use Bun workspace** monorepo (not Turborepo) — simpler, less overhead
- **Extract incrementally**: start with `packages/shared` (types, constants), then `packages/core` (AI logic)
- **Keep Next.js** as the web framework — don't switch to Vite + TanStack Router
- **Add Turborepo later** only when build caching becomes valuable (3+ apps)

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Full Turborepo monorepo (as attempted) | SKIP — too much overhead for current scale |
| Bun workspace monorepo (no Turborepo) | CARRY — simpler, native to Bun |
| Stay single-app, extract npm packages later | VIABLE — if desktop isn't prioritized |
| Nx monorepo | SKIP — even more complex than Turborepo |
