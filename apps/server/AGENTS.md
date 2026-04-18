# apps/server/AGENTS.md — Server API Guidelines

> Guidelines for the API server. See root [AGENTS.md](../AGENTS.md) for universal rules.

---

## Architecture Overview

The server provides API endpoints for the Gosto design pipeline, handling AI orchestration and data persistence.

```
apps/server/
├── src/
│   ├── routes/                # API route handlers
│   │   ├── plan.ts
│   │   ├── pipeline/
│   │   ├── export.ts
│   │   └── projects.ts
│   ├── middleware/            # Express/Fastify middleware
│   ├── services/              # Business logic
│   └── index.ts              # Server entry point
└── package.json
```

---

## API Route Patterns

**Thin route handlers using shared packages:**

```typescript
// routes/pipeline/layout.ts
import { LayoutPipeline } from "@gosto/core/pipeline/layout";
import type { PipelineLayoutRequest, PipelineLayoutResponse } from "@gosto/shared/contracts";

export async function POST(request: Request) {
  const body: PipelineLayoutRequest = await request.json();

  const pipeline = new LayoutPipeline({
    provider: createClaudeProvider(),
    systemPrompt: getSystemPrompt("ui-ux"),
  });

  try {
    const result = await pipeline.generate(body);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: "layout_failed", message: error.message }, { status: 500 });
  }
}
```

**Streaming responses for long-running operations:**

```typescript
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = await pipeline.streamLayout(prompt);
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

---

## Error Handling Patterns

**Structured error types in shared contracts:**

```typescript
// Uses types from @gosto/shared/contracts
export type ApiError =
  | { type: "auth"; message: string }
  | { type: "rate_limit"; message: string; retryAfter?: number }
  | { type: "timeout"; message: string; retryAfter?: number }
  | { type: "validation"; message: string; field?: string };
```

**Retry logic for transient errors:**

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-transient errors
      if (isPermanentError(error)) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

function isPermanentError(error: unknown): boolean {
  const err = error as any;
  return err.type === "auth" || err.type === "validation";
}
```

---

## Security Patterns

**API key encryption at rest:**

```typescript
// Uses encryption from @gosto/db/crypto
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

export function encryptApiKey(plainText: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}

export function decryptApiKey(encryptedBase64: string): string {
  const buffer = Buffer.from(encryptedBase64, "base64");

  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + 16);

  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

function deriveKey(salt: Buffer): Buffer {
  return process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
    : randomBytes(32); // For development only
}
```

---

## Pipeline Orchestration

**Four-stage AI pipeline:**

1. **Plan (`/api/plan`)** — Determine concept count and visual directions
   - Input: User prompt
   - Output: Array of concept descriptions (2-6)

2. **Layout (`/api/pipeline/layout`)** — Generate HTML/CSS with sizing hints
   - Input: Prompt, concept ID, size hints
   - Output: HTML string with inline styles, size hints

3. **Images (`/api/pipeline/images`)** — Fill placeholders with real images
   - Input: HTML with placeholder IDs, preferred sources
   - Output: HTML with image URLs

4. **Review (`/api/pipeline/review`)** — Visual QA and auto-fixes
   - Input: Rendered HTML, images
   - Output: HTML with fixes applied

5. **Critique (`/api/pipeline/critique`)** — Generate improvement feedback
   - Input: Previous HTML, previous feedback
   - Output: Improvement suggestions for next iteration

**Sequential vs Parallel Modes**:

- **Sequential**: Critique from Frame N-1 feeds into Frame N
- **Parallel**: All concepts generated independently (faster, less coherent)

---

## Database Integration

**Use Drizzle ORM from @gosto/db:**

```typescript
import { db } from "@gosto/db";
import { projects, designs } from "@gosto/db/schema";

// Create project
await db.insert(projects).values({
  id: generateId(),
  name: "My Project",
  canvasState: JSON.stringify(canvasState),
});

// Query designs
const projectDesigns = await db
  .select()
  .from(designs)
  .where(eq(designs.projectId, projectId));
```

---

## Testing Guidelines

**Test API endpoints:**

```typescript
// routes/pipeline/layout.test.ts
import { describe, it, expect } from "vitest";
import { POST } from "./layout";

describe("POST /api/pipeline/layout", () => {
  it("generates HTML from prompt", async () => {
    const request = new Request("http://localhost/api/pipeline/layout", {
      method: "POST",
      body: JSON.stringify({
        prompt: "A pricing card",
        conceptId: "1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.html).toContain("<div");
  });
});
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for layout/QA |
| `GEMINI_API_KEY` | Yes | Gemini API key for images |
| `ENCRYPTION_KEY` | Yes | AES-256 key for API key encryption |
| `DATABASE_URL` | Yes | SQLite database path |

---

## Licensing Note

This app is AGPL-3.0 licensed. See root [AGENTS.md](../../AGENTS.md) for dual-license rules. Never statically import from `packages/pro/`.

---

## Related Guides

- [packages/shared/AGENTS.md](../packages/shared/AGENTS.md) — API contracts
- [packages/core/AGENTS.md](../packages/core/AGENTS.md) — Pipeline implementation
- [packages/db/AGENTS.md](../packages/db/AGENTS.md) — Database schema
