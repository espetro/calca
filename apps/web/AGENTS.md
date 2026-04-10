# apps/web/AGENTS.md — Web Frontend Guidelines

> Guidelines for the Next.js frontend app. See root [AGENTS.md](../AGENTS.md) for universal rules.

---

## Architecture Overview

The web app is a **SPA-like Next.js application** using App Router. It serves as the primary interface for the AI design canvas.

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main canvas page
│   │   ├── layout.tsx         # Root layout
│   │   └── api/               # API routes
│   │       ├── plan/
│   │       ├── pipeline/
│   │       ├── export/
│   │       └── projects/
│   ├── components/            # React components
│   │   ├── canvas/
│   │   ├── design-frame/
│   │   └── ui/
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   └── lib/                   # Utilities
└── package.json
```

---

## State Management (Zustand)

**Replace 20+ useState hooks with centralized stores:**

```typescript
// stores/canvas.ts
import { create } from "zustand";

interface CanvasState {
  viewport: { x: number; y: number; scale: number };
  selectedIds: string[];
  zoomTo: (scale: number) => void;
  setViewport: (viewport: CanvasState["viewport"]) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  viewport: { x: 0, y: 0, scale: 1 },
  selectedIds: [],
  zoomTo: (scale) => set((state) => ({ viewport: { ...state.viewport, scale } })),
  setViewport: (viewport) => set({ viewport }),
}));
```

**Use stores in components:**

```typescript
// Don't
const [scale, setScale] = useState(1);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Do
const { scale, zoomTo } = useCanvasStore();
const { selectedIds, setSelectedIds } = useSelectionStore();
```

---

## Canvas Interaction Patterns

**CSS transform-based pan/zoom with native wheel events:**

```typescript
// hooks/use-canvas.ts
import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvas";

export function useCanvas() {
  const { viewport, setViewport, zoomTo } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startViewportRef = useRef({ x: 0, y: 0, scale: 1 });

  // Pan with drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startViewportRef.current = viewport;
    },
    [viewport],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    setViewport({
      x: startViewportRef.current.x + dx,
      y: startViewportRef.current.y + dy,
      scale: startViewportRef.current.scale,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Zoom with wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, viewport.scale * delta));

      // Zoom toward mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newViewportX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
      const newViewportY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

      zoomTo(newScale, newViewportX, newViewportY);
    },
    [viewport.scale, viewport.x, viewport.y],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return {
    containerRef,
    viewport,
  };
}
```

---

## API Route Patterns

**Thin route handlers using shared packages:**

```typescript
// app/api/pipeline/layout/route.ts
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

## Performance Optimization

**Virtualization for 50+ frames:**

```typescript
// components/canvas-virtualizer.tsx
import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvas';

export function CanvasVirtualizer({ children }: { children: React.ReactNode }) {
  const { viewport } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleFrames, setVisibleFrames] = useState<string[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate which frames are in viewport
    const containerRect = container.getBoundingClientRect();
    const visibleFrames: string[] = [];

    frames.forEach(frame => {
      const frameRect = getFrameBoundingClientRect(frame.id);
      if (
        frameRect.right >= containerRect.left &&
        frameRect.left <= containerRect.right
      ) {
        visibleFrames.push(frame.id);
      }
    });

    setVisibleFrames(visibleFrames);
  }, [viewport]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {frames
        .filter(frame => visibleFrames.includes(frame.id))
        .map(frame => (
          <DesignFrame key={frame.id} frame={frame} />
        ))
      }
    </div>
  );
}
```

**Debounced state persistence:**

```typescript
// hooks/use-debounce-persist.ts
import { useEffect, useRef } from "react";
import { saveProject } from "@/lib/projects";

export function useDebouncePersist(data: any, delayMs = 500, key: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveProject(key, data);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delayMs, key]);
}
```

---

## Export Patterns

**AI-powered format conversion:**

```typescript
// app/api/export/route.ts
import type { ExportRequest, ExportResponse } from "@gosto/shared/contracts";

export async function POST(request: Request) {
  const body: ExportRequest = await request.json();

  let content: string;
  let mimeType: string | undefined;

  switch (body.format) {
    case "svg": {
      // SVG via foreignObject wrapping
      content = generateSVG(body.html, body.width, body.height);
      mimeType = "image/svg+xml";
      break;
    }
    case "png": {
      // PNG via html-to-image
      const blob = await generatePNG(body.html);
      content = await blob.text();
      mimeType = "image/png";
      break;
    }
    case "tailwind": {
      // Tailwind CSS via Claude
      content = await convertToTailwind(body.html);
      break;
    }
    case "react": {
      // React component via Claude
      content = await convertToReact(body.html);
      break;
    }
    default:
      return Response.json(
        { error: "invalid_format", message: `Unsupported format: ${body.format}` },
        { status: 400 },
      );
  }

  return Response.json({ content, mimeType } as ExportResponse);
}

async function generateSVG(html: string, width: number, height: number): Promise<string> {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
      ${html}
    </div>
  </foreignObject>
</svg>
  `.trim();
}
```

---

## Testing Guidelines

**Test canvas stores:**

```typescript
// stores/canvas.test.ts
import { describe, it, expect } from "vitest";
import { useCanvasStore } from "./canvas";

describe("useCanvasStore", () => {
  it("zooms to fit after generation", () => {
    const { zoomTo } = useCanvasStore.getState();
    zoomTo(1);
    expect(useCanvasStore.getState().scale).toBe(1);
  });
});
```

**Run tests:**

```bash
bun test
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `C` | Comment tool |
| `Space + Drag` | Pan canvas |
| `Ctrl + Scroll` | Zoom |
| `Ctrl + 0` | Zoom to fit |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |

---

## Related Guides

- [packages/shared/AGENTS.md](../packages/shared/AGENTS.md) — Type definitions
- [packages/core/AGENTS.md](../packages/core/AGENTS.md) — AI pipeline patterns
