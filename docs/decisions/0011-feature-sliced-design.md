# Feature-Sliced Design for `src/` Organization

## Metadata

- **Status**: Accepted (implemented, transitional — target architecture is the monorepo described in AGENTS.md)
- **Date**: 2026-04-12
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

The Calca codebase is growing quickly. New capabilities—canvas interactions, AI design generation, settings, comments, export, and onboarding—are being added in rapid succession. Without an explicit structural contract, code tends to accumulate in flat or ad-hoc directories (`components/`, `hooks/`, `lib/`), making it hard to locate feature-specific logic, enforce boundaries, and onboard new contributors. We need a scalable architecture that keeps features isolated while still allowing shared infrastructure to evolve.

## Decision Drivers

* **Separation of concerns** — UI, state, API, and utilities should be colocated per feature rather than scattered by technical type.
* **Feature isolation** — A developer working on comments should not need to understand the internals of the design pipeline.
* **Independent development** — Features should be ownable slices that can be developed, tested, and reasoned about in parallel.
* **Path to monorepo** — The chosen structure should not block the longer-term goal of extracting features into packages (see AGENTS.md).

## Considered Options

* **Flat structure** — Keep `components/`, `hooks/`, `lib/`, etc., and place files by technical type. Simple at small scale, but becomes a maze as features multiply.
* **Layer-based structure** — Organize strictly by layer (`ui/`, `api/`, `state/`) across the whole app. Better than flat, but still forces developers to jump across directories to work on a single feature.
* **Feature-Sliced Design (FSD)** — Organize `src/` by business domain (`features/canvas`, `features/design`, etc.) with internal sub-layers (`ui/`, `hooks/`, `api/`, `lib/`) and explicit import rules between layers.

## Decision Outcome

Chosen option: **"Feature-Sliced Design"**

FSD gives us the best of both worlds: feature isolation for day-to-day velocity, and a clear layering contract (`app/`, `widgets/`, `features/`, `shared/`) that prevents accidental coupling. It also aligns well with the eventual monorepo migration because each feature slice is already a bounded unit of code.

### Consequences

* Good: Clear feature boundaries make it obvious where new code belongs.
* Good: Import rules (`features/` may not import from other `features/`) enforce decoupling and push truly shared code into `shared/`.
* Bad: Potential duplication across features when similar UI patterns or helpers are needed; vigilance is required to extract genuinely shared code.
* Bad: Migration effort to monorepo later will require moving feature directories into `packages/` and updating import paths.
* Neutral: The current `components/`, `hooks/`, and `lib/` directories still exist during the transitional period; they will be incrementally absorbed into slices or `shared/`.

## Validation

The `src/` directory already follows this pattern:

```
src/
├── app/
├── widgets/
├── features/
│   ├── canvas/
│   ├── comments/
│   ├── design/
│   ├── export/
│   ├── onboarding/
│   └── settings/
├── shared/
└── lib/
```

Each feature contains `ui/`, `hooks/`, `api/`, `lib/`, and an `index.ts` barrel export. We will know the decision is working if:

* New PRs add files inside `features/{name}/` rather than top-level `components/` or `hooks/`.
* Cross-feature imports remain rare and are resolved by moving code to `shared/`.
* The eventual monorepo migration can lift a feature directory into a package with minimal internal reorganization.

## More Information

* [Feature-Sliced Design documentation](https://feature-sliced.design/)
* [src/features/README.md](../../src/features/README.md) — local migration progress and import rules
* [AGENTS.md](../../AGENTS.md) — monorepo target architecture
