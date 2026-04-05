# POC Product Requirements Document

> Gosto POC (Proof of Concept) — What was implemented, validated, and discovered during the monorepo migration attempt.

## 1. POC Objective

Validate whether the original single-page Next.js app ("Otto Canvas" / "Gosto") could be decomposed into a Bun/Turborepo monorepo with:
- Dedicated Hono server backend
- TanStack Router SPA frontend
- Shared packages (core AI logic, database, types, logger)
- Electrobun desktop shell
- Mastra AI framework for generation pipelines
- Drizzle ORM + SQLite for persistence

## 2. What the POC Attempted

### 2.1 Monorepo Structure

```
apps/
  server/     → Hono HTTP server with Mastra AI workflows
  web/        → Vite + TanStack Router SPA
  cli/        → CLI tool (purpose unclear)
  landing/    → Marketing landing page
packages/
  core/       → AI-agnostic logic (prompts, parsers)
  database/   → Drizzle ORM + SQLite schema
  types/      → Shared TypeScript types
  logger/     → Shared logging utility
platforms/
  desktop/    → Electrobun desktop wrapper
```

### 2.2 Technology Stack Choices

| Layer | Original (Production) | POC (Attempted) |
|-------|----------------------|-----------------|
| Runtime | Node.js (Vercel) | Bun |
| Monorepo | None (single Next.js app) | Turborepo |
| Backend | Next.js API Routes | Hono |
| Frontend | Next.js App Router (SSR) | Vite + TanStack Router (SPA) |
| Canvas | CSS transforms + `@use-gesture/react` | React Flow |
| Database | localStorage + IndexedDB | Drizzle ORM + SQLite |
| AI | Direct Anthropic/Gemini SDK calls | Mastra framework |
| Desktop | None | Electrobun |

## 3. Current State of Original Codebase (Reference)

The working codebase (pre-monorepo) lives in `src/` and is a fully functional Next.js 16 app:

### 3.1 Architecture

**Single page app** — `src/app/page.tsx` (1,700+ lines) orchestrates everything:
- Canvas with pan/zoom (CSS transforms + native wheel events)
- Multi-model AI pipeline (layout → images → review → critique)
- Comment/revision system with queued processing
- Frame drag, rubber-band selection, keyboard shortcuts
- Image drop with compression + IndexedDB persistence

**API Routes** (8 endpoints in `src/app/api/`):
- `/api/plan` — Concept planning (Claude generates style variations)
- `/api/pipeline/layout` — Main HTML generation (streaming, 350 lines)
- `/api/pipeline/images` — Image generation (Unsplash/DALL-E/Gemini with fallback chain)
- `/api/pipeline/review` — Visual QA pass (Claude reviews + fixes)
- `/api/pipeline/critique` — Design critique for sequential improvement
- `/api/generate` — Legacy generation endpoint
- `/api/export` — Format conversion (SVG/Tailwind/React via Claude)
- `/api/probe-models` — Model availability checking

**State Management**:
- `useCanvas()` — Pan/zoom with native wheel handler, zoom-to-fit
- `useSettings()` — localStorage-backed settings (API keys, model, presets)
- `usePersistedGroups()` — Canvas state with IndexedDB for base64 images
- `usePersistedImages()` — Reference images with IndexedDB
- `useOnboarding()` — First-run tour state

**Key Types** (`src/lib/types.ts`):
- `DesignIteration` — A single generated design frame (HTML, position, comments)
- `GenerationGroup` — A cluster of iterations from one prompt
- `CanvasImage` — Dropped reference images
- `Comment` / `CommentMessage` — Figma-style comment pins with AI threads

### 3.2 Pipeline Architecture

The multi-model pipeline is the core value:

```
User Prompt
    ↓
[1] Plan (Claude) → N visual style concepts
    ↓
[2] Layout (Claude, streaming) → HTML with image placeholders
    ↓
[3] Images (Unsplash/DALL-E/Gemini) → Real images in placeholders
    ↓
[4] Review (Claude) → Visual QA + auto-fix
    ↓
[5] Critique (Claude) → Feedback for next variation
    ↓
Next variation uses critique → improves iteratively
```

Two modes:
- **Sequential critique loop** (default): Each frame learns from the previous
- **Quick mode**: All frames in parallel, no cross-learning

### 3.3 Proven Features

These features work in production and are validated:
1. Infinite canvas with smooth pan/zoom (CSS transforms)
2. Multi-model pipeline (Claude layout → image generation → visual QA)
3. Sequential critique loop (each variation improves on the last)
4. Comment/revision system (Figma-style pins + AI response threads)
5. Frame management (drag, select, rubber-band, delete)
6. Image context (drop reference images, AI includes in designs)
7. Export (SVG, Tailwind CSS, React components)
8. Remix presets (color/layout/typography variations)
9. Design presets (UI/UX, Marketing, Brand/Ad)
10. .otto file import/export for session persistence

## 4. POC Findings

### 4.1 What Was Completed

The POC directories (`apps/`, `packages/`, `platforms/`) contain **only `node_modules/`** — source code was removed before this analysis. This means:
- npm packages were installed (dependencies were resolved)
- Source code was written but subsequently stripped
- The POC reached at least the dependency installation phase
- No `turbo.json` exists at root, suggesting Turborepo was never fully configured

### 4.2 What Wasn't Completed

- No actual Turborepo build pipeline (no `turbo.json`)
- No `AGENTS.md` knowledge base
- No `docs/` directory with decisions or PRDs
- POC source code was removed (only `node_modules` artifacts remain)
- No evidence of successful integration testing

### 4.3 Root Cause Analysis

The monorepo migration was likely abandoned mid-stream because:
1. **Scope too large** — Rewriting a working 1,700-line page component into separate packages requires simultaneous changes across 6+ directories
2. **No incremental path** — The POC tried to decompose everything at once rather than extracting one package at a time
3. **Hono + TanStack Router** is a complete architecture change from Next.js — different routing, SSR, data fetching, deployment
4. **React Flow** would require rethinking the entire canvas paradigm — current CSS transform approach works well
5. **Mastra** adds abstraction overhead for what are currently straightforward SDK calls

## 5. Key Metrics from Original Codebase

| Metric | Value |
|--------|-------|
| Total components | 11 |
| Custom hooks | 5 |
| API routes | 8 |
| Types/Interfaces | 8 |
| Main page lines | ~1,700 |
| Pipeline stages | 4 (layout, images, review, critique) |
| AI models supported | 5 Claude models + Gemini + Unsplash + DALL-E |
| Persistence | localStorage + IndexedDB |

## 6. Recommendation

The POC demonstrates that a full architectural rewrite carries high risk with uncertain benefit. The v2 approach should:
1. **Preserve the working pipeline** — the 4-stage multi-model pipeline is the core IP
2. **Extract incrementally** — pull shared types into packages first, then API routes, then state
3. **Keep Next.js** — the App Router works well for this use case (SPA-like client + API routes)
4. **Upgrade canvas incrementally** — consider React Flow only if multi-user collaboration is needed
5. **Add server-side persistence** — SQLite + Drizzle is the right call for desktop, but as an additive step
