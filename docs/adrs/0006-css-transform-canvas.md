# CSS Transform Canvas over React Flow

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-05
- **Decision makers**: Calca Engineering

## Context and Problem Statement

Calca's canvas needs to support free-form placement of design frames — each an isolated HTML/CSS design rendered in an iframe — on an infinite, pannable, zoomable surface. Users expect Figma-like interactions: drag to pan, scroll to zoom, click-and-drag to rubber-band select multiple frames, and smooth zoom-to-fit. The implementation must handle dynamic iframe heights (measured via `postMessage`) and arbitrary frame sizing without constraining positions to a grid or fixed node model.

The team evaluated React Flow as a replacement for the existing canvas, weighing its built-in pan/zoom, node management, and minimap against the specific requirements of a design tool.

## Decision Drivers

- **Free-form placement**: Frames can be placed at arbitrary coordinates with no grid constraints
- **Iframe isolation**: Each design frame renders in an isolated iframe; React Flow's node model doesn't account for this
- **Dynamic sizing**: Frames have dynamic heights measured post-load; React Flow expects fixed-size nodes
- **Rubber-band selection**: Users must be able to drag-select multiple frames; this is not a graph edge/connection model
- **Performance**: Canvas interactions must feel as smooth as Figma; 60fps pan/zoom is non-negotiable
- **DOM fidelity**: Design frames need full DOM access (hover states, pointer events, CSS containment); WebGL/canvas would lose this

## Considered Options

- **CSS transforms canvas (current)** — Pan and zoom via `translate()` + `scale()` applied to a canvas container; frames are absolutely positioned; native wheel events handle input
- **React Flow** — Node-graph library with built-in pan/zoom, node management, edges, and minimap; designed for flowcharts and workflows
- **HTML5 Canvas / WebGL** — Full custom rendering pipeline; maximum performance but loses DOM/CSS capabilities entirely
- **Konva.js / Fabric.js** — 2D canvas libraries; designed for shape/image manipulation, not HTML/CSS rendering
- **Custom Figma-style canvas** — Fully bespoke implementation; significant engineering effort; deferred for a future iteration

## Decision Outcome

Chosen option: **"CSS transforms canvas (current)"**

The existing CSS transforms implementation is lean (≈170 lines in `useCanvas()`), battle-tested, and maps directly to the canvas interaction model Calca requires. React Flow's node graph abstraction — fixed-size nodes, grid positioning, connection edges — fundamentally misaligns with iframe-based design frames and free-form canvas placement. The current approach handles all core interactions correctly; future iterations can add virtualization, minimap, and undo/redo as orthogonal improvements.

## Consequences

- **Good**: Pan and zoom are implemented with CSS `translate()` and `scale()` on a container element, achieving 60fps smoothness with no library overhead
- **Good**: Frames are absolutely positioned HTML elements; iframe isolation is preserved and natural
- **Good**: Rubber-band multi-select is implemented via manual hit-testing against canvas coordinates; no abstraction leakage
- **Good**: Wheel event handling with `{ passive: false }` provides pixel-perfect Figma-like zoom (Cmd/Ctrl + scroll, pinch gesture)
- **Good**: Zoom-to-fit calculates a bounding box across all frames and animates to the ideal scale and offset
- **Bad**: No virtualization — all frames are in the DOM at all times; performance degrades past ~100 frames
- **Bad**: No minimap — users can lose orientation on large canvases
- **Neutral**: Canvas state (groups, positions) lives in the React component tree; a dedicated canvas store is not needed at this time

## Validation

The decision is validated by the current canvas implementation in `apps/web/src/features/canvas/`. All core interactions — pan, zoom, zoom-to-fit, frame drag, rubber-band select, multi-select, image overlay, and comment pins — are implemented and functional. The next iteration may add `@tanstack/virtual` for frame virtualization and a minimap overlay component as independent improvements.

## More Information

- Current canvas implementation: `apps/web/src/features/canvas/`
- Canvas hook: `useCanvas()` (~170 lines, manages offset, scale, and viewport-to-canvas coordinate transforms)
