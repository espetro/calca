# Vertical Slice Architecture for Calca Monorepo

## Metadata

- **Status**: Accepted
- **Date**: 2026-03-01
- **Decision makers**: Project architect

## Context and Problem Statement

The Calca monorepo has grown to encompass multiple delivery surfaces (`apps/web`, `apps/server`, `apps/cli`, `apps/landing`, `platforms/desktop`), shared infrastructure packages (`packages/core`, `packages/shared`, `packages/db`, `packages/ui`), and configuration packages (`packages/config`, `packages/logger`). Without a clear architectural contract governing how these directories relate to each other, the risk of circular dependencies, tangled import graphs, and blurred ownership boundaries increases as the team scales.

Within individual apps (notably `apps/web`), Feature-Sliced Design (FSD) already governs code organisation — features live under `src/features/`, share a common layer structure, and enforce strict intra-slice boundaries. However, FSD does not prescribe how whole delivery slices (the web app, the server, the desktop wrapper, the shared packages) should interact. A complementary principle is needed to govern the **between-slice** layer of the monorepo.

## Decision Drivers

- **Separation of concerns** — each delivery surface should own its full stack (UI, state, API routes, data access) without leaking implementation details to siblings.
- **Independent deployability** — the web app, server, CLI, and desktop wrapper should be deployable, testable, and versionable independently where possible.
- **Clear dependency direction** — developers must always know whether a given import is allowed; ambiguous paths create hidden coupling.
- **Team ownership per slice** — distinct teams or individuals can own a vertical slice end-to-end without coordinating with every other slice on every change.
- **Alignment with existing FSD** — any new principle must complement, not contradict, the FSD conventions already in place within `apps/web`.

## Considered Options

- **Monolithic single-app layout** — place everything under `src/` and namespace by domain. Rejected because Calca already has distinct delivery surfaces (web, server, CLI, desktop) that require separate build outputs and deployment targets.
- **Microservices split into separate repos** — one repo per service. Rejected because the project benefits from shared tooling (TypeScript config, Turborepo, linting, AI SDK), atomic cross-cutting changes, and unified CI that a monorepo naturally provides.
- **Vertical Slice Architecture (VSA)** — each `apps/*` and `platforms/*` entry is a self-contained vertical slice owning its full stack. Shared horizontal layers live in `packages/*`. Imports flow strictly inward (apps → packages → packages/shared). Cross-slice imports are forbidden. Chosen.

## Decision Outcome

Chosen option: **"Vertical Slice Architecture (VSA)"**

The monorepo is organised into two kinds of directories:

1. **Vertical slices** (`apps/*`, `platforms/*`) — each is a standalone delivery surface. A slice contains everything it needs: UI components, API route handlers, server-side logic, state management, and data-access code. A slice may depend only on packages in `packages/*`. It may not import from another slice.

2. **Horizontal packages** (`packages/*`) — shared infrastructure consumed by one or more slices. They are intentionally narrow: `packages/shared` holds only types and cross-slice contracts; `packages/core` holds AI-agnostic business logic; `packages/db` holds schema definitions; `packages/ui` holds reusable UI primitives. No package in `packages/*` may import from an `apps/*` slice, preventing circular dependencies.

Import direction is strictly enforced:

```
apps/*      → imports from packages/*
platforms/* → imports from packages/*
packages/*  → imports from packages/shared
packages/shared → no internal imports
```

Cross-slice imports between `apps/web` and `apps/server`, or between any two vertical slices, are forbidden.

### Consequences

- Good: Each slice has a clear owner and a single responsibility, enabling parallel development without merge conflicts on architectural boundaries.
- Good: Dependency direction is always unambiguous — developers can trace any import back to its origin without fear of hidden circular chains.
- Good: Shared horizontal packages (`packages/core`, `packages/shared`, etc.) are forced to stay thin and broadly useful, because they cannot depend on any one slice's specifics.
- Bad: There is a risk of duplication across slices — for example, a data-fetching utility written for `apps/web` might need to be re-implemented for `apps/cli` if it is not generic enough to live in `packages/*`.
- Bad: Strict cross-slice isolation can make shared state or cross-cutting concerns (e.g., a feature flag that must affect both web and desktop) harder to model; they must flow through `packages/shared` rather than direct import.
- Neutral: FSD continues to govern the internal organisation of each slice (e.g., `apps/web/src/features/`, `src/model/`, `src/ui/`). VSA does not replace FSD — it sits above it and defines only the between-slice contract.

## Validation

The following checks are enforced via lint rules and review:

1. **Import-direction lint** — a custom ESLint / TypeScript-eslint rule (or path-based `tsconfig` aliases) blocks imports from `apps/*` into `packages/*` and from one slice into another.
2. **CI import-graph check** — a script (e.g., `bun run lint:imports`) runs `tsc --project tsconfig.json --noEmit` with strict `paths` aliases and verifies no slice imports another slice.
3. **Monorepo tree matches expectation** — the directory tree at the top of `AGENTS.md` reflects the accepted structure, and new slices or packages are added to it atomically.
4. **Cross-reference with AGENTS.md** — the "Cross-Package Import Rules" section in `AGENTS.md` codifies the same import direction as this ADR. Any divergence between the two documents is treated as a regression requiring a new ADR.

## More Information

- **Monorepo structure as of this decision** (mirrors the tree in `AGENTS.md`):

```
calca/
├── apps/
│   ├── web/          → Next.js frontend (SPA-like) — see [apps/web/AGENTS.md](./apps/web/AGENTS.md)
│   └── server/       → API server — see [apps/server/AGENTS.md](./apps/server/AGENTS.md)
├── platforms/
│   └── desktop/      → Electrobun wrapper (macOS + Windows) — see [platforms/desktop/AGENTS.md](./platforms/desktop/AGENTS.md)
├── packages/
│   ├── shared/       → Types & contracts — see [packages/shared/AGENTS.md](./packages/shared/AGENTS.md)
│   ├── core/         → AI-agnostic logic — see [packages/core/AGENTS.md](./packages/core/AGENTS.md)
│   ├── db/           → Database schema (Drizzle)
│   └── ui/           → Reusable UI components
└── docs/             → Architecture decisions, PRD
```

- **FSD alignment** — Feature-Sliced Design (FSD) organises code **within** a vertical slice (e.g., `apps/web/src/features/`). VSA governs the **between-slice** boundaries in the monorepo. They are complementary, not competing.
- **Related ADRs** — see [0001-feature-sliced-design.md](0001-feature-sliced-design.md) for the feature-level code organisation within each vertical slice.
- **Feature-Sliced Design reference** — [https://feature-sliced.design](https://feature-sliced.design)
