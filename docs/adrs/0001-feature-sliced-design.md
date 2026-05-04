# Feature-Sliced Design for `src/` Organization

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-12
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

The Calca codebase is growing quickly. New capabilities—canvas interactions, AI design generation, settings, comments, export, and onboarding—are being added in rapid succession. Without an explicit structural contract, code tends to accumulate in flat or ad-hoc directories (`components/`, `hooks/`, `lib/`), making it hard to locate feature-specific logic, enforce boundaries, and onboard new contributors. We need a scalable architecture that keeps features isolated while still allowing shared infrastructure to evolve.

## Decision Drivers

* **Separation of concerns** — UI, state, API, and utilities should be colocated per feature rather than scattered by technical type.
* **Feature isolation** — A developer working on comments should not need to understand the internals of the design pipeline.
* **Independent development** — Features should be ownable slices that can be developed, tested, and reasoned about in parallel.
* **Scalability** — The structure must remain navigable as the team and codebase grow.

## Considered Options

* **Flat structure** — Keep `components/`, `hooks/`, `lib/`, etc., organized by technical type. Simple at small scale, but becomes a maze as features multiply.
* **Layer-based structure** — Organize strictly by layer (`ui/`, `api/`, `state/`) across the whole app. Better than flat, but still forces developers to jump across directories to work on a single feature.
* **Feature-Sliced Design (FSD)** — Organize `src/` by business domain (`features/canvas`, `features/design`, etc.) with internal sub-layers (`ui/`, `hooks/`, `api/`, `lib/`) and explicit import rules between layers.

## Decision Outcome

Chosen option: **"Feature-Sliced Design"**

FSD gives us the best of both worlds: feature isolation for day-to-day velocity, and a clear layering contract (`app/`, `widgets/`, `features/`, `shared/`) that prevents accidental coupling.

### Consequences

* Good: Clear feature boundaries make it obvious where new code belongs.
* Good: Import rules (`features/` may not import from other `features/`) enforce decoupling and push truly shared code into `shared/`.
* Bad: Potential duplication across features when similar UI patterns or helpers are needed; vigilance is required to extract genuinely shared code.
* Neutral: Features that grow large may need further internal segmentation.

## Validation

The `apps/web/src/` directory follows this structure:

```
apps/web/src/
├── app/               # Next.js App Router pages & layouts
├── widgets/           # Composite UI blocks composed from features
│   ├── prompt-bar/    #   Bottom prompt input
│   └── toolbar/       #   Top toolbar
├── features/          # Business logic organized by domain
│   ├── canvas/        #   Pan, zoom, drag, frame management
│   ├── canvas-hud/    #   Canvas HUD overlay
│   ├── comments/       #   Figma-style comment pins & AI response threads
│   ├── context-toolbar/ # Context-aware toolbar actions
│   ├── design/         #   AI pipeline (plan → layout → images → review → critique)
│   ├── export/         #   Export to Figma, Tailwind CSS, React components
│   ├── feedback/       #   User feedback & bug reporting
│   ├── mode-sidebar/   #   Mode switching sidebar
│   ├── onboarding/     #   Tutorial, walkthrough, first-run experience
│   └── settings/       #   BYOK, model selection, preferences
├── shared/            # Code shared across features
│   ├── ai/            #   AI client & providers
│   ├── constants/     #   Application-wide constants
│   ├── types/         #   Domain type definitions
│   └── utils/         #   Pure utility functions
└── lib/               # Cross-cutting utilities
```

Each feature slice contains `ui/`, `hooks/`, `api/`, `lib/`, and an `index.ts` barrel export. The decision is working if:

* New PRs add files inside `features/{name}/` rather than top-level `components/` or `hooks/`.
* Cross-feature imports remain rare and are resolved by moving code to `shared/`.

## More Information

* [Feature-Sliced Design documentation](https://feature-sliced.design/)
* [apps/web/src/features/README.md](../../apps/web/src/features/README.md) — FSD import rules and layer reference
