# PRD v2 Delta — Original → POC → v2 Target

> Compares the original Otto Canvas PRD, the POC monorepo migration attempt, and the v2 target state. Shows what changed, what was learned, and what v2 should aim for.

---

## Architecture Comparison

| Aspect | Original (Otto Canvas) | POC (Attempted) | v2 Target |
|--------|----------------------|-----------------|-----------|
| **Runtime** | Node.js (Vercel) | Bun | Bun |
| **Monorepo** | Single Next.js app | Turborepo (never configured) | Bun workspace |
| **Web Framework** | Next.js 16 App Router | Vite + TanStack Router | Next.js App Router |
| **Server** | Next.js API Routes (8) | Hono standalone | Next.js API Routes (keep) |
| **Canvas** | CSS transforms + custom hooks | React Flow | CSS transforms + Zustand + virtualization |
| **Persistence** | localStorage + IndexedDB | SQLite + Drizzle (planned) | SQLite + Drizzle |
| **AI Pipeline** | Direct SDK calls | Mastra framework | Plain TS in `packages/core` |
| **State** | 20+ useState in page.tsx | (not reached) | Zustand stores with slices |
| **Desktop** | None | Electrobun (not reached) | Deferred to post-MVP |
| **Testing** | None | None | Vitest unit + integration |

---

## User Stories Status

### ✅ Implemented in Original (CARRY to v2)

| ID | User Story | Original Status | v2 Change |
|----|-----------|----------------|-----------|-----------|
| US-001 | Generate design from text prompt | ✅ Working | Extract pipeline to `packages/core` |
| US-002 | Sequential critique loop | ✅ Working | Same, server-side queue |
| US-003 | Quick parallel mode | ✅ Working | Same |
| US-004 | Infinite canvas navigation | ✅ Working | Add virtualization, minimap |
| US-005 | Adaptive frame sizing | ✅ Working | Same |
| US-006 | Reference image context | ✅ Working | Same |
| US-007 | Click-to-comment revision | ✅ Working | Server-side queue |
| US-008 | Comment thread conversations | ✅ Working | Same |
| US-009 | Remix with presets | ✅ Working | Same |
| US-010 | Multi-model image generation | ✅ Working | Same + caching |
| US-011 | Visual QA review | ✅ Working | Same |
| US-012 | BYOK API keys | ✅ Working | Add server-side encryption |
| US-013 | Model selection | ✅ Working | Same |
| US-014 | Design presets | ✅ Working | Extract to `packages/core` |
| US-015 | Multi-format export | ✅ Working | Same + more formats |
| US-016 | Session persistence | ✅ Working | Migrate to SQLite |
| US-017 | Canvas file export/import | ✅ Working | Same |
| US-018 | Guided onboarding | ✅ Working | Same |
| US-019 | Prompt library | ✅ Working | Same |
| US-020 | Keyboard shortcuts | ✅ Working | Same |

### ❌ Attempted in POC (SKIP for v2)

| Technology | POC Intent | v2 Decision |
|-----------|-----------|-------------|
| Turborepo | Full monorepo build pipeline | **SKIP** — never configured. Use Bun workspace instead |
| Hono | Replace Next.js API routes | **SKIP** — no benefit. Keep Next.js routes |
| TanStack Router | Replace Next.js routing | **SKIP** — single-page app doesn't need it |
| React Flow | Replace CSS canvas | **SKIP** — wrong abstraction. Enhance CSS canvas |
| Mastra | Wrap AI pipeline | **SKIP** — over-abstraction. Use plain TypeScript |
| Electrobun | Desktop wrapper | **SKIP** (post-MVP) — defer desktop |

### 🔧 New in v2 (Not in Original or POC)

| Feature | Description | Priority |
|---------|-------------|----------|
| Zustand state management | Replace 20+ useState with typed stores | High |
| `packages/core` extraction | AI pipeline logic as testable functions | High |
| `packages/shared` extraction | Types, constants, schemas shared across apps | High |
| SQLite + Drizzle | Server-side persistence replacing localStorage | High |
| Virtual canvas rendering | Only render visible frames in DOM | Medium |
| Minimap overlay | Navigate large canvases | Medium |
| Undo/redo | Canvas operation history | Medium |
| Error types | Categorized errors with retry logic | Medium |
| API key encryption | Server-side encrypted key storage | Medium |
| Toast notifications | User-facing error/success feedback | Low |
| PWA support | Offline-like experience for desktop feel | Low |

---

## Functional Requirements Delta

### What Changes (Original FR → v2 FR)

| FR# | Original | v2 Change | Impact |
|-----|----------|-----------|--------|
| FR-1 | Pipeline in API routes | Extract logic to `packages/core`. Routes become thin wrappers. | Testability, reusability |
| FR-2 | CSS canvas with useState | CSS canvas with Zustand. Add virtualization. | Performance at scale |
| FR-5 | Settings in localStorage | Settings in SQLite via API. Keys encrypted at rest. | Security |
| FR-6 | localStorage + IndexedDB | SQLite + Drizzle. Phased migration. | Reliability, query capability |
| FR-7 | Client-side export | Same + cache conversions in DB. | Performance |

### What's New (v2-only FRs)

| FR# | Requirement | Description |
|-----|-------------|-------------|
| FR-8 | State management | Zustand stores: canvas, design, pipeline, comment, settings |
| FR-9 | Shared packages | `packages/shared` (types, schemas), `packages/core` (AI pipeline) |
| FR-10 | Bun workspace | Monorepo via `package.json` workspaces, no Turborepo initially |
| FR-11 | Testing | Vitest for `packages/core` and `packages/shared`. API route integration tests |
| FR-12 | Virtual canvas | Render only frames within viewport bounds + buffer |
| FR-13 | Minimap | Canvas overview widget showing frame positions |

### What's Unchanged (Carry Forward)

| FR# | Requirement | Notes |
|-----|-------------|-------|
| FR-3 | Design frames (DesignCard) | Same iframe rendering, auto-measurement |
| FR-4 | Comment system | Same pin model, thread model, queue processing |
| FR-7 | Export system | Same formats, add caching |

---

## Non-Functional Requirements Delta

| NFR# | Original | v2 Change |
|------|----------|-----------|
| NFR-1 | Client-side perf only | Add: unit test coverage > 80% for `packages/core`. Pipeline functions testable without HTTP |
| NFR-2 | Client-only, stateless | Add: SQLite for persistence. Server-managed sessions. Still no user accounts for MVP |
| NFR-3 | API keys in localStorage | Add: Encrypted key storage in SQLite. Session tokens instead of raw keys in requests |
| NFR-4 | Zero-config start | Keep: Still zero-config for MVP. SQLite created automatically on first run |
| NFR-5 | Modern browsers only | Same. Add: PWA manifest for desktop-like experience |

---

## Technical Architecture Delta

### Original (Single Next.js App)
```
src/
  app/
    page.tsx (1,700 lines — everything)
    api/ (8 routes — direct SDK calls)
  components/ (11 components)
  hooks/ (5 hooks — useState based)
  lib/ (types.ts, pipeline.ts)
```

### POC Attempted (Turborepo Monorepo — Never Completed)
```
apps/server/     → Hono (empty — only node_modules)
apps/web/        → Vite + TanStack (empty — only node_modules)
apps/cli/        → CLI tool (empty — only node_modules)
apps/landing/    → Marketing site (empty — only node_modules)
packages/core/   → AI logic (empty — only node_modules)
packages/database/ → Drizzle schema (empty — only node_modules)
packages/types/  → Shared types (empty — only node_modules)
packages/logger/ → Logging (empty — only node_modules)
platforms/desktop/ → Electrobun (empty — only node_modules)
```

### v2 Target (Bun Workspace — Incremental Build)
```
packages/
  shared/          → Types, constants, schemas (EXTRACT FIRST)
  core/            → AI pipeline: prompts, parsers, providers (EXTRACT SECOND)
  database/        → Drizzle schema + migrations (ADD THIRD)

apps/
  web/             → Next.js App Router (MIGRATE from src/)

(No Turborepo initially — add when 3+ apps exist)
(No separate server — Next.js API routes stay)
(No desktop until post-MVP)
```

---

## Key Decisions by POC MADR

| MADR | Verdict | v2 Action |
|------|---------|-----------|
| 0004 — Turborepo | SKIP | Use Bun workspace. Start with `packages/shared`. Add Turborepo later if needed |
| 0005 — Hono Server | SKIP | Keep Next.js API routes. Same streaming, timeout, and error handling |
| 0006 — React Flow | REDESIGN | Keep CSS transforms. Add Zustand + virtualization + minimap |
| 0007 — SQLite + Drizzle | CARRY | Server-side persistence. Phased migration from localStorage |
| 0008 — Mastra AI | REDESIGN | Extract to `packages/core` with provider interfaces. No framework |

---

## Migration Priority Order

Based on POC learnings, v2 should extract in this order:

1. **`packages/shared`** — Types, constants, schemas (zero risk, immediate benefit)
2. **State management → Zustand** — Replace useState in page.tsx with stores
3. **Component decomposition** — Break page.tsx into feature components
4. **`packages/core`** — AI pipeline logic extracted from API routes
5. **`packages/database`** — Drizzle schema + SQLite for persistence
6. **Persistence migration** — localStorage/IndexedDB → SQLite (phased)
7. **Testing infrastructure** — Vitest + integration tests
8. **Canvas enhancements** — Virtualization, minimap, undo/redo
9. **Desktop (post-MVP)** — Tauri or Electrobun wrapper

---

## Risks from POC

| Risk | Mitigation |
|------|-----------|
| Premature decomposition | Extract one package at a time, verify each works before moving on |
| Framework churn | Keep Next.js. Don't rewrite what works |
| Over-abstraction | Plain TypeScript functions, not frameworks. Add abstractions when patterns repeat 3+ times |
| Scope creep | Each extraction is a separate PR. No "big bang" migration |
| Lost functionality | Every carried-forward user story has a test before migration starts |
