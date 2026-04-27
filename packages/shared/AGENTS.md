# packages/shared/AGENTS.md — Shared Types & Contracts

> Type definitions and API contracts shared across all packages. See root [AGENTS.md](../../AGENTS.md) for universal rules.

---

## Package Purpose

The `shared` package is the **base layer** of the monorepo. It contains:

- TypeScript type definitions
- API request/response contracts
- Zod schemas for validation
- No internal dependencies (leaf node)

**Key rule**: `packages/shared` has no imports from other internal packages.

---

## File Structure

```
packages/shared/
├── src/
│   ├── types.ts              # Core domain types
│   ├── contracts.ts          # API contracts
│   ├── schemas.ts            # Zod validation schemas
│   └── index.ts              # Barrel export
└── package.json
```

---

## Core Types

**DesignIteration** — A single generated design:

```typescript
// src/types.ts
export interface DesignIteration {
  id: string;
  html: string;
  label?: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  prompt: string;
  comments: Comment[];
  createdAt: Date;
}
```

**GenerationGroup** — A collection of related designs:

```typescript
export interface GenerationGroup {
  id: string;
  prompt: string;
  iterations: DesignIteration[];
  position: { x: number; y: number };
  createdAt: Date;
}
```

**Comment** — Figma-style comment pins:

```typescript
export interface Comment {
  id: string;
  designId: string;
  position: { x: number; y: number };
  text: string;
  number: number;
  status: "waiting" | "working" | "done";
  thread?: CommentThread;
  createdAt: Date;
}

export interface CommentThread {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}
```

**Settings** — User preferences:

```typescript
export interface Settings {
  apiKeyAnthropic: string | null;
  apiKeyGemini: string | null;
  apiKeyUnsplash: string | null;
  apiKeyOpenAI: string | null;
  model: string;
  systemPromptPreset: "ui-ux" | "marketing" | "brand";
  conceptCount: number;
  quickMode: boolean;
  showZoomControls: boolean;
}
```

---

## API Contracts

**Plan stage** — Determine visual directions:

```typescript
// src/contracts.ts
export interface PlanRequest {
  prompt: string;
  conceptCount: number;
  quickMode: boolean;
}

export interface PlanResponse {
  concepts: Array<{
    id: string;
    description: string;
    visualStyle: string;
    vibe: string;
    aesthetic: string;
  }>;
}
```

**Layout stage** — Generate HTML/CSS:

```typescript
export interface PipelineLayoutRequest {
  prompt: string;
  conceptId: string;
  sizeHints?: Record<string, { width: number; height: number }>;
  vibe?: string;
  style?: string;
  aesthetic?: string;
}

export interface PipelineLayoutResponse {
  html: string;
  sizeHints: Record<string, { width: number; height: number }>;
}
```

**Images stage** — Generate/fetch images:

```typescript
export interface PipelineImagesRequest {
  html: string;
  placeholders: Array<{
    id: string;
    prompt: string;
    preferredSource?: "unsplash" | "dalle" | "gemini";
  }>;
}

export interface PipelineImagesResponse {
  html: string;
  images: Record<string, string>; // id -> URL
}
```

**Review stage** — Visual QA:

```typescript
export interface PipelineReviewRequest {
  html: string;
  screenshot?: string; // base64
}

export interface PipelineReviewResponse {
  html: string;
  fixes: string[];
}
```

**Critique stage** — Generate improvement feedback:

```typescript
export interface PipelineCritiqueRequest {
  html: string;
  previousCritique?: string;
  prompt: string;
}

export interface PipelineCritiqueResponse {
  critique: string;
  suggestions: string[];
}
```

**Export formats**:

```typescript
export interface ExportRequest {
  html: string;
  format: "svg" | "png" | "jpg" | "tailwind" | "react";
  width?: number;
  height?: number;
}

export interface ExportResponse {
  content: string;
  mimeType?: string;
}
```

---

## Error Types

**Structured API errors:**

```typescript
export type ApiError =
  | { type: "auth"; message: string }
  | { type: "rate_limit"; message: string; retryAfter?: number }
  | { type: "timeout"; message: string; retryAfter?: number }
  | { type: "validation"; message: string; field?: string }
  | { type: "provider_error"; message: string; provider: string };
```

---

## Validation Schemas

**Zod schemas for runtime validation:**

```typescript
// src/schemas.ts
import { z } from "zod";

export const PlanRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  conceptCount: z.number().int().min(1).max(10).default(4),
  quickMode: z.boolean().default(false),
});

export const PipelineLayoutRequestSchema = z.object({
  prompt: z.string().min(1),
  conceptId: z.string(),
  sizeHints: z
    .record(
      z.object({
        width: z.number().positive(),
        height: z.number().positive(),
      }),
    )
    .optional(),
  vibe: z.string().optional(),
  style: z.string().optional(),
  aesthetic: z.string().optional(),
});

export const SettingsSchema = z.object({
  apiKeyAnthropic: z.string().nullable(),
  apiKeyGemini: z.string().nullable(),
  apiKeyUnsplash: z.string().nullable(),
  apiKeyOpenAI: z.string().nullable(),
  model: z.string(),
  systemPromptPreset: z.enum(["ui-ux", "marketing", "brand"]),
  conceptCount: z.number().int().min(1).max(10),
  quickMode: z.boolean(),
  showZoomControls: z.boolean(),
});
```

---

## Usage Examples

**Import in apps:**

```typescript
// In apps/web or apps/server
import type { DesignIteration, PlanRequest } from "@calca/shared/types";
import type { PlanResponse } from "@calca/shared/contracts";
import { PlanRequestSchema } from "@calca/shared/schemas";

// Validate request
const result = PlanRequestSchema.safeParse(body);
if (!result.success) {
  return Response.json({ error: "validation", issues: result.error.issues }, { status: 400 });
}
```

---

## Adding New Types

1. Define the type in `src/types.ts` for domain models
2. Define contracts in `src/contracts.ts` for API shapes
3. Add Zod schema in `src/schemas.ts` for validation
4. Export from `src/index.ts`
5. Update relevant package guides

---

## Licensing Note

This package is AGPL-3.0 licensed. See root [AGENTS.md](../../AGENTS.md) for dual-license rules. The shared base layer must NEVER import from `packages/pro/`.

---

## Related Guides

- [apps/web/AGENTS.md](../../apps/web/AGENTS.md) — Web frontend usage
- [apps/server/AGENTS.md](../../apps/server/AGENTS.md) — API implementation
- [packages/core/AGENTS.md](../core/AGENTS.md) — Pipeline types
