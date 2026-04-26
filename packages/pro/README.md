# Calca Pro / Enterprise Edition

This package contains the **Enterprise/Pro features** of Calca, licensed under
the **Elastic License v2 (ELv2)**.

## License

All code in this directory and its subdirectories is licensed under the Elastic
License v2. See [licenses/ELv2.txt](../../licenses/ELv2.txt) for the full license
text.

This is **not** open-source software. Use, modification, and distribution are
subject to the restrictions outlined in the Elastic License v2.

## What Belongs Here

This package contains premium features that are not part of the AGPL-licensed
core (TBD).

## Architecture Decision

We chose a **single `packages/pro/` package** (Option A) over per-app `ee/`
subfolders (Option B) for the following reasons:

1. **Monorepo consistency**: The project already uses workspace packages for
   shared code. A `packages/pro/` package follows this pattern naturally.
2. **Single license boundary**: One directory/package = one license. This makes
   compliance auditing straightforward.
3. **Cross-app consumption**: Enterprise features can be consumed by the web
   app, desktop app, and server without duplicating code.
4. **Conditional builds**: The package can be excluded from AGPL builds by
   simply not including it in the workspace or build configuration.
5. **Feature-Sliced Design compatibility**: Internally, this package follows FSD
   conventions with `features/`, `shared/`, and `widgets/` directories, keeping
   the architecture consistent with the rest of the monorepo.

## Import Rules

- **AGPL code must NEVER statically import from this package.**
- This package may import from `packages/shared/` and `packages/core/` (AGPL
  packages) but not vice versa.

## Getting Started

```typescript
// In an AGPL app, use the pro-loader
import { loadProFeature } from "@/pro-loader";

const feature = await loadProFeature("team-collaboration");
if (feature) {
  feature.initialize();
}
```

## Structure

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
