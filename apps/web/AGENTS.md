# apps/web/AGENTS.md — Web Frontend Guidelines

> Guidelines for the Next.js frontend app. See root [AGENTS.md](../AGENTS.md) for universal rules.

---

## Architecture Overview

The web app is a **SPA-like Next.js application** using App Router with **Feature-Sliced Design (FSD)**. It serves as the primary interface for the AI design canvas.

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main canvas page
│   │   ├── layout.tsx         # Root layout
│   │   ├── providers.tsx      # App providers (Jotai, QueryClient)
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API routes
│   │       ├── plan/
│   │       ├── pipeline/
│   │       ├── export/
│   │       ├── generate/
│   │       └── probe-models/
│   ├── features/              # FSD features (business logic slices)
│   │   ├── canvas/            # Canvas state, hooks, UI
│   │   ├── design/            # Design generation pipeline
│   │   ├── settings/          # App settings (BYOK, models)
│   │   ├── comments/          # Comment threads
│   │   ├── export/            # Export functionality
│   │   └── onboarding/        # Onboarding flow
│   ├── widgets/               # Complex composite components
│   │   ├── prompt-bar/        # AI prompt input bar
│   │   └── toolbar/           # Canvas toolbar
│   ├── shared/                # Shared utilities (no business logic)
│   │   ├── ai/                # AI client & providers
│   │   ├── constants/         # Shared constants
│   │   ├── types/             # Shared TypeScript types
│   │   └── utils/             # Utility functions
│   └── lib/                   # Cross-cutting utilities
│       ├── pipeline.ts        # Pipeline orchestration
│       └── types.ts           # Global type helpers
└── package.json
```

---

## State Management (Jotai)

**Atom-based state with Jotai:**

```typescript
// features/canvas/state/canvas-atoms.ts
import { atom } from "jotai";

export const viewportAtom = atom({ x: 0, y: 0, scale: 1 });
export const selectedIdsAtom = atom<string[]>([]);
```

**Use atoms in components:**

```typescript
// Don't
const [scale, setScale] = useState(1);

// Do
const [viewport, setViewport] = useAtom(viewportAtom);
const scale = viewport.scale;
```

---

## Canvas Interaction Patterns

**CSS transform-based pan/zoom with native wheel events:**

See `features/canvas/hooks/use-canvas.ts` for the full implementation.

Key patterns:
- Pan with drag (mouse down + move)
- Zoom with wheel (toward cursor position)
- State stored in Jotai atoms (`viewportAtom`)

---

## API Route Patterns

**Thin route handlers using shared packages:**

```typescript
// app/api/pipeline/layout/route.ts
import { generateLayout } from "@/features/design/api/layout";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await generateLayout(body);
  return Response.json(result);
}
```

---

## Testing Guidelines

**Test features:**

```typescript
// features/canvas/hooks/use-canvas.test.ts
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCanvas } from "./use-canvas";

describe("useCanvas", () => {
  it("initializes with default viewport", () => {
    const { result } = renderHook(() => useCanvas());
    expect(result.current.viewport.scale).toBe(1);
  });
});
```

**Run tests:**

```bash
bun test
```

---

## Related Guides

- [packages/shared/AGENTS.md](../packages/shared/AGENTS.md) — Type definitions
- [packages/core/AGENTS.md](../packages/core/AGENTS.md) — AI pipeline patterns

