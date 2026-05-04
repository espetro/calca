# Pro Package Architecture

## Metadata

- **Status**: Accepted
- **Date**: 2026-05-04
- **Decision makers**: Core development team

## Context and Problem Statement

The Calca project required a licensing boundary between open-source core features and proprietary enterprise functionality. Without architectural separation, the dual-license model would be unenforceable and cross-contamination of license obligations could occur. The challenge: create a clean boundary that maintains monorepo consistency while enabling proprietary features for enterprise customers.

## Decision Drivers

* License purity must be maintained — AGPL-3.0 code cannot mix with ELv2 code in the same package
* Cross-app consumption — enterprise features need to be shared across web and desktop applications
* Conditional builds — enterprise features should compile/ship only when explicitly enabled
* Monorepo consistency — avoid fragmentation into separate repositories
* Feature isolation — enterprise features should be easily distinguishable from core features

## Considered Options

* **Option A: Per-app `ee/` subfolders** — Separate `apps/web/ee/` and `platforms/desktop/ee/` packages for each app. Rejected: creates build complexity, duplicate code, and inconsistent boundaries.
* **Option B: Single `packages/pro/` package** — One central location for all enterprise features with FSD structure. Chosen: clean boundary, shared code, consistent licensing.
* **Option C: Feature-scoped packages** — Multiple packages like `packages/pro-export/`, `packages/pro-analytics/`. Rejected: over-complicates the import graph and violates simplicity principle.

## Decision Outcome

Chosen option: **"Single `packages/pro/` package"**

We implemented a single `packages/pro/` package following Feature-Sliced Design (FSD) principles, with strict import boundaries and license enforcement. This approach provides the cleanest licensing boundary while enabling cross-app consumption and maintaining monorepo consistency.

### Package Structure

```
packages/pro/
├── src/
│   ├── features/     # EE features following FSD
│   ├── shared/       # Shared EE utilities
│   ├── widgets/      # EE UI components
│   └── index.ts      # Public API barrel export
├── package.json
├── LICENSE
└── README.md
```

### License Boundary Rules

- AGPL core code must NEVER statically `import` from `packages/pro/`
- `packages/pro/` may import from AGPL core (`packages/shared/`, `packages/core/`) but not vice versa
- Every file in `packages/pro/` includes the ELv2 header with copyright notice
- Package follows standard ES module exports via barrel file

### Cross-App Consumption

The single `packages/pro/` package is imported by both `apps/web/` and `platforms/desktop/` applications when enterprise features are enabled. This ensures feature parity across platforms while avoiding code duplication.

### Conditional Build Support

The package structure supports conditional builds through:

- Dynamic imports in consuming applications
- Feature flags for runtime behavior
- Separate bundle configuration for enterprise vs core builds

## Consequences

* Good: Clean licensing boundary prevents accidental license violations
* Good: Shared enterprise code reduces duplication across web and desktop apps
* Good: FSD structure maintains consistency with the core codebase
* Good: Single point of enterprise feature management simplifies maintenance
* Good: Import direction prevents circular dependencies between AGPL and ELv2 code
* Bad: Requires discipline to maintain import boundaries and file placement rules
* Bad: FSD structure adds some complexity for simple enterprise features
* Bad: Potential confusion about where to place new enterprise vs core features

## Validation

* License boundary checks via CI/CD linting to prevent illegal imports
* Package dependency audits quarterly to ensure no cross-contamination
* Code reviews must include license boundary verification
* Feature flag usage monitoring to ensure enterprise features are properly gated

## More Information

* Dual licensing model: `AGENTS.md` (Licensing & Open-Core Architecture section)
* Architecture decisions: `docs/PRD.md`
* Import rules and examples: `packages/pro/README.md`
