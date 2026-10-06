# @calca/canvas-flow

React Flow adapter for the Calca canvas — the open canvas layer that renders a versioned document model as interactive, agent-editable frames. Turns a [`@calca/canvas-base`](https://www.npmjs.com/package/@calca/canvas-base) `CanvasStore` into a live [React Flow](https://reactflow.dev) projection, and maps user edits back into canvas commands with undo history.

Use it to build an infinite-canvas UI — design canvas, prototype board, AI generation surface, marketing layout tool — without owning the document model, ordering, undo, or change-projection logic yourself.

## What it gives you

- **`<CanvasProvider>` + `<CanvasArea>`** — a ready canvas surface: pan/zoom viewport, selection, drag, frame rendering.
- **`useCanvas()` / `useCanvasViewport()`** — imperative `CanvasHandle` (`fitToView`, viewport reads) inside the provider.
- **Store → React Flow projection** — `CanvasProjection`, `ShapeView`, `BindingView` adapt records and bindings to nodes/edges; register renderers per shape type via `ShapeView`.
- **Commands in, events out** — user edits become `canvas-base` commands (with origin + history), and store `change` events re-project the view.
- **Jotai atoms** — `canvasOffsetAtom`, `canvasScaleAtom`, `isPanningAtom`, `groupsAtom` for composing your own HUD/toolbars.
- **`@xyflow/*` confined here** — your app and the `@calca/*` base packages never depend on React Flow; swap renderers without touching the document layer.

```tsx
import { createCanvasStore } from "@calca/canvas-base";
import { CanvasProvider, CanvasArea } from "@calca/canvas-flow";

const store = createCanvasStore();

export function Board() {
  return (
    <CanvasProvider store={store}>
      <CanvasArea />
    </CanvasProvider>
  );
}
```

## Stack

TypeScript · React 19 · React Flow 12 (`@xyflow/react`) · Jotai. Pairs with `@calca/canvas-base` (document model), `@calca/canvas-ui` (headless chrome), `@calca/mcp` (drive the same canvas from an AI agent over MCP).

Part of [Calca](https://calca.illo.fyi) — open source, BYOK AI canvas for the web and desktop.

## License

Apache-2.0
