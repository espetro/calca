# AGENTS.md — Gosto Development Guidelines

> **Progressive Disclosure**: Start here for the big picture. Drill down into package-specific guides for implementation details.

---

## Quick Orientation

**Gosto** is a desktop-first AI design tool that transforms natural language prompts into polished HTML/CSS design variations on an infinite canvas.

**Monorepo Structure:**
```
gosto/
├── apps/
│   ├── web/          → Next.js frontend (SPA-like) — see [apps/web/AGENTS.md](./apps/web/AGENTS.md)
│   ├── desktop/      → Electrobun wrapper — see [apps/desktop/AGENTS.md](./apps/desktop/AGENTS.md)
│   └── server/       → API server — see [apps/server/AGENTS.md](./apps/server/AGENTS.md)
├── packages/
│   ├── shared/       → Types & contracts — see [packages/shared/AGENTS.md](./packages/shared/AGENTS.md)
│   ├── core/         → AI-agnostic logic — see [packages/core/AGENTS.md](./packages/core/AGENTS.md)
│   ├── db/           → Database schema (Drizzle)
│   └── ui/           → Reusable UI components
└── docs/             → Architecture decisions, PRD
```

---

## Universal Rules (Apply Everywhere)

### Cross-Package Import Rules

**Imports flow inward only:**
```
apps/*      → imports from packages/*
packages/*  → imports from packages/shared (base layer)
packages/shared → no internal imports
```

**Never circular:**
- ❌ `packages/core` → `apps/web`
- ❌ `packages/db` → `packages/core`
- ❌ `packages/shared` → `packages/core`

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | `PascalCase.tsx` | `DesignFrame.tsx` |
| Hooks | `useCamelCase.ts` | `useCanvas.ts` |
| API Routes | `route.ts` | `app/api/plan/route.ts` |
| Stores | `store.ts` or `index.ts` | `stores/canvas.ts` |
| Utils | `camelCase.ts` | `utils/format.ts` |

### TypeScript Strict Mode

Always enabled. No exceptions.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## Tech Stack Overview

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Bun | latest |
| Monorepo | Bun Workspaces | latest |
| Frontend | Next.js | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | latest |
| Database | SQLite + Drizzle ORM | latest |
| AI Layout | Anthropic SDK (Claude) | 0.74.x |
| AI Images | Google GenAI SDK (Gemini) | 1.41.x |
| Desktop | Electrobun | latest |
| Testing | Vitest | latest |

---

## Quick Start

```bash
# Install dependencies
bun install

# Run development server (web app at https://gosto.localhost)
bun run dev-web

# Run all services via Turborepo
bun run dev

# Build all packages
bun run build

# Run tests
bun test

# Type check
bun run typecheck
```

### Portless (Named Dev URLs)

Dev servers use [portless](https://github.com/vercel-labs/portless) for stable `.localhost` URLs instead of port numbers. First run auto-starts the HTTPS proxy on port 443 and generates a local CA (run `npx portless trust` if you see certificate warnings).

| Script | URL |
|--------|-----|
| `bun run dev-web` | `https://gosto.localhost` |

- **Git worktrees**: each worktree gets a unique subdomain (e.g. `fix-ui.gosto.localhost`)
- **Bypass**: set `PORTLESS=0` to run without the proxy (e.g. `PORTLESS=0 bun run dev-web`)
- **Install**: already included as a dev dependency (`npx portless` or via scripts)

---

## Local Testing with LM Studio

For development and testing without consuming paid API credits, the app defaults to a local LM Studio instance via the OpenAI-compatible provider.

**Default environment values (already set in `.env` and `.env.local.example`):**
```bash
NEXT_PUBLIC_AI_BASE_URL=http://localhost:1234/v1
NEXT_PUBLIC_AI_API_KEY=""
NEXT_PUBLIC_AI_MODEL=lfm2.5-1.2b-instruct
```

**Steps:**
1. Install [LM Studio](https://lmstudio.ai/)
2. Download and load the `lfm2.5-1.2b-instruct` model (or any other OpenAI-compatible model)
3. Start the local server on port `1234`
4. In Settings, select **OpenAI-Compatible** provider — the Base URL and Model will be pre-filled
5. Leave the API Key field empty (local servers usually don't require auth)
6. The app will probe `/models` and allow generation immediately

These defaults are wired into `use-settings.ts` via `NEXT_PUBLIC_*` variables so they persist across browser sessions and fresh clones.

---

## E2E Testing
Specs are written in Gauge Markdown and run via agent-browser.
See [docs/testing/e2e-specs.md](docs/testing/e2e-specs.md) for conventions, built-in steps, and how to add new ones.

## Package-Specific Guides

Dive deeper into the area you're working on:

| Package | Focus Area | Guide |
|---------|------------|-------|
| `apps/web` | Next.js frontend, canvas, components, API routes | [apps/web/AGENTS.md](./apps/web/AGENTS.md) |
| `apps/server` | API endpoints, authentication, business logic | [apps/server/AGENTS.md](./apps/server/AGENTS.md) |
| `apps/desktop` | Electrobun wrapper, native menus, system tray | [apps/desktop/AGENTS.md](./apps/desktop/AGENTS.md) |
| `packages/shared` | Type definitions, API contracts, schemas | [packages/shared/AGENTS.md](./packages/shared/AGENTS.md) |
| `packages/core` | AI providers, pipeline stages, prompts | [packages/core/AGENTS.md](./packages/core/AGENTS.md) |

---

## Key Concepts

### VSA Anatomy
Every AI design concept has three components:
- **Vibe** — Overall mood ("warm and inviting", "bold and minimal")
- **Style** — Design language ("glassmorphism", "flat design")
- **Aesthetic** — Visual refinement ("elegant", "gritty")

### Pipeline Stages
1. **Plan** — Determine concept count and visual directions
2. **Layout** — Generate HTML/CSS with sizing hints
3. **Images** — Fill placeholders with real images
4. **Review** — Visual QA and auto-fixes
5. **Critique** — Generate improvement feedback

### Design Presets
Three built-in presets: `ui-ux`, `marketing`, `brand`

---

## References

- **PRD v2**: `docs/prd-v2.md` — Complete feature requirements
- **POC Learnings**: `docs/poc-learnings.md` — Architecture decisions
- **MADRs**: `docs/decisions/` — Technology decision documents
- **Sisyphus Plans**: `.sisyphus/plans/` — Implementation planning
