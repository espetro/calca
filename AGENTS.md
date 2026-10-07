# AGENTS.md — Calca Development Guidelines

> **Progressive Disclosure**: Start here for the big picture. Drill down into package-specific guides for implementation details.

---

## Quick Orientation

**Calca** is an open, file-based, free-form AI canvas that any agent can drive. It is being re-architected into three layers (tracking issue: [#37](https://github.com/espetro/calca/issues/37)):

| Layer                    | Packages                                                                                                                 | Licence    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **1 — Canvas library**   | `@calca/canvas-base` (RF-free primitives) · `@calca/canvas-ui` (headless UI) · `@calca/canvas-flow` (React Flow adapter) | Apache-2.0 |
| **2 — Agent playground** | `@calca/mcp-core` · `@calca/mcp` (`calca` CLI) · `calca serve` relay                                                     | Apache-2.0 |
| **3 — Calca app**        | `@calca/agent-core` (Apache-2.0) · `@calca/app` (AGPL-3.0)                                                               | AGPL-3.0   |

`packages/pro` stays under Elastic License v2.

The project backlog is at https://github.com/users/espetro/projects/6/views/1 .

---

> **⚠️ Current State — Read This First**
>
> The table above describes the **target** architecture. The **actual** codebase today:
>
> | Area                                               | Status                                                                                                                 |
> | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
> | `apps/web`                                         | ✅ Active — the Calca app: **Vite SPA** + TanStack Router, Feature-Sliced Design (`app`/`features`/`widgets`/`shared`) |
> | `apps/server`                                      | Scaffolding — Hono API; also bundled as the web demo's root service worker (`src/sw.ts` → landing `dist/sw.js`)      |
> | `apps/cli`                                         | Vestigial scaffold — the real L2 CLI is `packages/mcp` (`@calca/mcp`)                                                    |
> | `apps/landing`                                     | ✅ Astro marketing site                                                                                                |
> | `apps/feedback-proxy`                              | ✅ Cloudflare Worker — creates GitHub issues from app feedback                                                         |
> | `packages/canvas` (`@app/canvas`, MIT)             | ❌ Removed — superseded by Layer 1 `@calca/canvas-*`                                                                     |
> | `packages/agent-core` (`@calca/agent-core`)        | ✅ Browser-safe agent-harness seam over the AI SDK `ToolLoopAgent` (BYOK)                                              |
> | `packages/pipeline` (`@calca/pipeline`)            | ✅ Generation pipeline steps (plan → layout → images → review → critique → summary)                                    |
> | `packages/core` (`@app/core`)                      | ✅ Providers, prompts, domain logic                                                                                    |
> | `packages/shared` (`@app/shared`)                  | ✅ Types & Zod schemas                                                                                                 |
> | `packages/logger` · `analytics` · `config` · `pro` | ✅ Infra / shared-config / ELv2 packages                                                                               |
> | `platforms/desktop`                                | ✅ Electrobun shell (macOS + Windows + Linux)                                                                                  |
> | Layer 1 `@calca/canvas-*`                          | ✅ Delivered — Phase 1 ([#39](https://github.com/espetro/calca/issues/39))                                             |
> | Layer 2 `@calca/mcp*`                              | ⚠️ In progress — `@calca/mcp-core` tool surface + `calca` CLI (Phase 2, [#40](https://github.com/espetro/calca/issues/40)) |

---

## Universal Rules (Apply Everywhere)

### Git Worktree Location

All git worktrees **must** be created under `./.worktrees/` (relative to the repo root). Never create worktrees in the repo root or elsewhere.

```bash
# ✅ Correct
git worktree add .worktrees/feature-name feat/feature-name

# ❌ Wrong
git worktree add feature-name feat/feature-name
```

### Worktree-Local Agent State

Some AI Agents cache the session state in a file, like `boulder.json`. When running in a worktree, agents **must** use a worktree-local boulder path instead of the project-wide one e.g. `.agents/boulder.json`. This prevents parallel agents in different worktrees from overwriting each other's state. Take for example:

```bash
# ✅ Correct — worktree-local state
.worktrees/feature-name/.sisyphus/boulder.json

# ❌ Wrong — project-wide state (shared across all worktrees)
.agents/boulder.json
```

Agents running from the main worktree may use the project-wide session state cache e.g. `.agents/boulder.json` as normal.

### Cross-Package Import Rules

**Imports flow inward only:**

```
apps/*, platforms/*  → imports from packages/*
packages/*           → imports from packages/shared (base layer)
packages/shared      → no internal imports
```

**Never circular:**

- ❌ `packages/core` → `apps/web`
- ❌ `packages/shared` → `packages/core`
- ❌ `packages/pipeline` → `packages/pro` (see Licensing)

### File Naming Conventions

| Type       | Pattern                  | Example            |
| ---------- | ------------------------ | ------------------ |
| Components | `PascalCase.tsx`         | `DesignFrame.tsx`  |
| Hooks      | `useCamelCase.ts`        | `useCanvas.ts`     |
| Stores     | `store.ts` or `index.ts` | `stores/canvas.ts` |
| Utils      | `camelCase.ts`           | `utils/format.ts`  |

### TypeScript & Code Style

Strict mode everywhere, no exceptions (see `packages/config/tsconfig/base.json`).

- `interface` over `type` for object shapes; `type` for unions/intersections
- Arrow functions; named exports (no default exports)
- Never commit `.env` or secrets
- `*.d.ts` is gitignored — force-add hand-written declaration files (`git add -f`)

---

## Dependency Governance

Single-version toolchains are governed by `catalogs.default` in the root `package.json`:

- **Cataloged deps**: `typescript`, `oxlint`, `oxfmt`, `vitest`, `ai`, `zod`
- Workspace manifests **must** declare them as `"catalog:"` — never a literal version. `bun run check:manifests` (CI + `validate`) fails the build on drift.
- Root `overrides` force the same versions transitively. Third-party packages that legitimately need zod 3 (Astro, `@tanstack/router-*`) are scoped back via nested `overrides` entries — extend that list only when a package actually breaks on zod 4.
- Requires **Bun ≥ 1.4** (`packageManager: bun@1.4.2`, CI `setup-bun`).

**Validation gates:**

| Command                  | What runs                                     | Used by             |
| ------------------------ | --------------------------------------------- | ------------------- |
| `bun run validate:quick` | manifests + typecheck + lint + format (~10 s) | `pre-push` git hook |
| `bun run validate`       | validate:quick **plus** tests                 | pre-PR gate         |

Git hooks (`commit-msg` commitlint, `pre-push` validate:quick) are declared in the `simple-git-hooks` map in the root `package.json` and written by `scripts/install-git-hooks.ts` on `bun install` (postinstall). The `simple-git-hooks` package is deliberately not a dependency — its own postinstall crashes under Bun's `.bun` store layout. The script degrades gracefully where `.git` or hooks can't be written — plain `bun install` needs no flags.

---

## Licensing & Open-Core Architecture

Three licences:

- **Apache-2.0** — the reusable libraries (Layer 1 `@calca/canvas-*`, Layer 2 `@calca/mcp*`, `@calca/agent-core`, and `@app/canvas` which is MIT pending relicensing)
- **AGPL-3.0** — the Calca app code (`apps/`, `packages/core`, `shared`, `pipeline`, `logger`, `analytics`)
- **Elastic License v2** — `packages/pro/` only

### Boundary Rules (MUST follow)

**Import direction**

- Core/app code must NEVER statically `import` from `packages/pro/`
- Pro code MAY import from core
- Never create a bridge between core and Pro code unless explicitly asked

**File placement**

- New features go in core by default
- Only place code in `packages/pro/` if explicitly asked to create a Pro/EE feature
- Never move files between `packages/pro/` and core in either direction

**File headers**

- Every new file in `packages/pro/` must have this header:
  ```
  // Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
  // Licensed under the Elastic License v2. See packages/pro/LICENSE for details.
  ```

**package.json**

- AGPL packages use `"license": "AGPL-3.0"`, library packages `"Apache-2.0"`, the Pro package `"LicenseRef-ELv2"`
- Never change these fields without being explicitly asked

**CLA & contributions**

- All new code you generate is authored by the project owner and does not require CLA
- If suggesting copy-pasting code from external sources, flag the original license explicitly

---

## Tech Stack Overview

| Layer    | Technology                       | Version    |
| -------- | -------------------------------- | ---------- |
| Runtime  | Bun                              | ≥1.4       |
| Monorepo | Bun Workspaces + Turborepo       | latest     |
| Frontend | Vite SPA, React, TanStack Router | 6.x / 19.x |
| Canvas   | React Flow (`@xyflow/react`)     | 12.x       |
| Styling  | Tailwind CSS                     | 4.x        |
| AI       | AI SDK (`ai` catalog)            | 7.x        |
| Schemas  | Zod (`catalog:`)                 | 4.x        |
| Desktop  | Electrobun                       | latest     |
| Testing  | Vitest (`catalog:`)              | 4.x        |
| Lint/Fmt | oxlint + oxfmt (`catalog:`)      | latest     |

---

## Quick Start

```bash
# Install dependencies (also installs git hooks)
bun install

# Web app dev server (Vite)
bun run --cwd apps/web dev

# Desktop app (web + Electrobun)
bun run dev:desktop

# Marketing site
bun run dev:landing

# Run everything via Turborepo
bun run dev

# Repo gates
bun run validate        # manifests + typecheck + lint + format + tests
bun run validate:quick  # same minus tests (~10 s, pre-push hook)
```

> **Backpressure:** Run `bun run validate` (from repo root or any package dir via `bun run validate` inside a package) before marking implementation tasks complete.

---

## Local Testing with LM Studio

For development without paid API credits, the app defaults to a local LM Studio instance via the OpenAI-compatible provider.

**Default environment values (already set in `.env.local.example`):**

```bash
VITE_AI_BASE_URL=http://localhost:1234/v1
VITE_AI_API_KEY=""
VITE_AI_MODEL=lfm2.5-1.2b-instruct
```

**Steps:**

1. Install [LM Studio](https://lmstudio.ai/)
2. Download and load the `lfm2.5-1.2b-instruct` model (or any other OpenAI-compatible model)
3. Start the local server on port `1234`
4. In Settings, select **OpenAI-Compatible** provider — the Base URL and Model will be pre-filled
5. Leave the API Key field empty (local servers usually don't require auth)
6. The app will probe `/models` and allow generation immediately

---

## E2E Testing

Specs are written in Gauge Markdown and run via agent-browser.
See [.agents/docs/testing/e2e-specs.md](.agents/docs/testing/e2e-specs.md) for conventions, built-in steps, and how to add new ones.

---

## Release Process

Uses **@changesets/cli** with unified versioning (all workspace packages in the `fixed` array of `.changeset/config.json` — versions stay unified). Changesets only manages workspace packages — root and Electrobun version files need manual sync.

**Workflow:**

1. `bunx changeset` — describe change and bump type
2. `bunx changeset version` — bumps all workspace packages
3. Manually update: root `package.json`, root `CHANGELOG.md`
4. Commit and tag: `git commit -m "chore: release vX.Y.Z" && git tag vX.Y.Z && git push --tags`

Desktop builds via GitHub Actions on `v*` tags.

Details: [.agents/docs/versioning.md](.agents/docs/versioning.md) — changesets + conventional commits, and [.agents/docs/desktop-releases.md](.agents/docs/desktop-releases.md) — desktop release/update pipeline.

## Package-Specific Guides

Dive deeper into the area you're working on:

| Package               | Focus Area                                    | Guide                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `apps/web`            | Vite SPA, FSD features, canvas integration    | [apps/web/AGENTS.md](./apps/web/AGENTS.md)                       |
| `apps/server`         | API endpoints, business logic                 | [apps/server/AGENTS.md](./apps/server/AGENTS.md)                 |
| `platforms/desktop`   | Electrobun wrapper, native menus, system tray | [platforms/desktop/AGENTS.md](./platforms/desktop/AGENTS.md)     |
| `packages/shared`     | Type definitions, schemas                     | [packages/shared/AGENTS.md](./packages/shared/AGENTS.md)         |
| `packages/core`       | AI providers, pipeline stages, prompts        | [packages/core/AGENTS.md](./packages/core/AGENTS.md)             |
| `packages/agent-core` | Agent-harness seam (contract + AI SDK impl)   | [packages/agent-core/AGENTS.md](./packages/agent-core/AGENTS.md) |

---

## Key Concepts

### VSA Anatomy

Every AI design concept has three components:

- **Vibe** — Overall mood ("warm and inviting", "bold and minimal")
- **Style** — Design language ("glassmorphism", "flat design")
- **Aesthetic** — Visual refinement ("elegant", "gritty")

### Pipeline Stages

See [PRD — Pipeline](.agents/docs/PRD.md) for full details.

1. **Plan** — Determine concept count and visual directions
2. **Layout** — Generate HTML/CSS with sizing hints
3. **Images** — Fill placeholders with real images
4. **Review** — Visual QA and auto-fixes
5. **Critique** — Generate improvement feedback

### Design Presets

Three built-in presets: `ui-ux`, `marketing`, `brand`

---

## References

- **Docs layout**: `docs/` is reserved for end-user documentation; internal/dev docs live in [.agents/docs/](.agents/docs/)
- **PRD**: [.agents/docs/PRD.md](.agents/docs/PRD.md) — Product vision, positioning, and key features (pre-v-next)
- **v-next epic**: [issue #37](https://github.com/espetro/calca/issues/37) — Three-layer plan; supersedes PRD positioning where they differ
- **POC Learnings**: [.agents/docs/poc-learnings.md](.agents/docs/poc-learnings.md) — Architecture decisions from prototyping
- **ADRs**: [.agents/docs/adrs/](.agents/docs/adrs/) — Architecture Decision Records (numbered `NNNN-description.md`; latest: `0008-agent-harness-taxonomy`)
- **Versioning**: [.agents/docs/versioning.md](.agents/docs/versioning.md) — Changesets + conventional commits
- **Desktop releases**: [.agents/docs/desktop-releases.md](.agents/docs/desktop-releases.md) — Distribution channels, signing, auto-update

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
