# apps/server/AGENTS.md — Server API Guidelines

> Guidelines for the API server. See root [AGENTS.md](../AGENTS.md) for universal rules.

---

## Architecture Overview

The server provides API endpoints for the Calca design pipeline, handling AI orchestration and data persistence.

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
import { LayoutPipeline } from "@calca/core/pipeline/layout";
import type { PipelineLayoutRequest, PipelineLayoutResponse } from "@calca/shared/contracts";

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
// Uses types from @calca/shared/contracts
// Uses encryption from @calca/db/crypto
// **Use Drizzle ORM from @calca/db:**
import { db } from "@calca/db";
import { projects, designs } from "@calca/db/schema";

// Create project
await db.insert(projects).values({
  id: generateId(),
  name: "My Project",
  canvasState: JSON.stringify(canvasState),
});

// Query designs
const projectDesigns = await db.select().from(designs).where(eq(designs.projectId, projectId));
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

| Variable            | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | Claude API key for layout/QA       |
| `GEMINI_API_KEY`    | Yes      | Gemini API key for images          |
| `ENCRYPTION_KEY`    | Yes      | AES-256 key for API key encryption |
| `DATABASE_URL`      | Yes      | SQLite database path               |

---

## Licensing Note

This app is AGPL-3.0 licensed. See root [AGENTS.md](../../AGENTS.md) for dual-license rules. Never statically import from `packages/pro/`.

---

## Related Guides

- [packages/shared/AGENTS.md](../packages/shared/AGENTS.md) — API contracts
- [packages/core/AGENTS.md](../packages/core/AGENTS.md) — Pipeline implementation
- [packages/db/AGENTS.md](../packages/db/AGENTS.md) — Database schema
