# Calca Pro / Enterprise Edition

Premium features for Calca, licensed under the **Elastic License v2 (ELv2)**.
This code is source-available — see [LICENSE](./LICENSE) for terms.

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
