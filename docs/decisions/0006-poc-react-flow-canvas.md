# 0006 — POC: React Flow over Custom CSS Canvas

| Attribute | Value |
|-----------|-------|
| Status | **REDESIGN** (POC verdict) |
| Date | 2026-04-05 |
| Decision | Attempted, reconsider approach for v2 |

## Context

The current canvas implementation uses:
- **CSS transforms** for pan/zoom (`translate()` + `scale()`)
- **Native wheel events** with `{ passive: false }` for smooth Figma-like zoom
- **React state** for canvas offset/scale (`useCanvas()` hook, 171 lines)
- **Absolute positioning** for design frames on the canvas
- **Manual hit-testing** for rubber-band selection
- **iframe rendering** for isolated HTML/CSS designs

The POC attempted to replace this with **React Flow** — a graph/flowchart library with built-in pan/zoom/node management.

## Decision

**Redesign.** The current CSS canvas works well but has limitations. React Flow is not the right replacement, but a canvas upgrade is warranted for v2.

## Rationale for Attempting React Flow

1. **Built-in pan/zoom** — No custom wheel handling needed
2. **Node management** — Automatic positioning, dragging, selection
3. **Connection edges** — Could show design iteration relationships
4. **Minimap** — Built-in overview widget
5. **Community** — Well-maintained, documented, React-native

## Rationale Against React Flow

1. **Wrong abstraction** — React Flow is for **node graphs** (flowcharts, workflows). Gosto needs a **design canvas** (free-form placement, arbitrary sizing)
2. **iframe incompatibility** — React Flow nodes have fixed sizes and constrained positioning. Design frames are iframes with dynamic heights measured via `postMessage`
3. **Custom rendering** — Each "node" is a full HTML/CSS design rendered in an isolated iframe. React Flow's virtualization would interfere
4. **Selection model mismatch** — React Flow selects nodes. Gosto needs rubber-band selection across arbitrary canvas positions
5. **Current approach works** — The CSS transform canvas with `useCanvas()` is 171 lines, smooth, and battle-tested

## Current Canvas Capabilities (Working)

| Feature | Implementation |
|---------|---------------|
| Pan | Mouse drag (space held) or scroll wheel |
| Zoom | Ctrl/Cmd + scroll, pinch gesture |
| Zoom to fit | Calculate bounding box, animate |
| Frame positioning | Absolute left/top with CSS transforms |
| Frame drag | Mouse event tracking with scale compensation |
| Rubber-band select | Manual hit-testing against canvas coordinates |
| Multi-select | Shift-click + rubber band |
| Image overlay | Dropped images as absolute-positioned elements |
| Comment pins | Positioned relative to design frame |

## Current Canvas Limitations (Fix in v2)

1. **No virtualization** — 100+ frames would slow down (all in DOM)
2. **No minimap** — Users get lost on large canvases
3. **No connection lines** — Can't visually show iteration lineage
4. **State in component** — Canvas state (groups, positions) lives in the page component, not a store
5. **No undo/redo** — No history tracking for canvas operations

## Consequences

### For v2
- **Keep CSS transforms** for the canvas layer (proven, performant)
- **Add a state manager** (Zustand) for canvas state instead of React state
- **Add virtualization** for frames beyond viewport (render only visible)
- **Add minimap** as a separate overlay component
- **Skip React Flow** entirely — wrong abstraction for design canvas
- Consider **@tanstack/virtual** for frame virtualization

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| React Flow | SKIP — wrong abstraction (graph vs canvas) |
| CSS transforms (current) | CARRY — works well, needs virtualization |
| HTML5 Canvas / WebGL | REDESIGN — high perf but complex, loses DOM benefits |
| Figma-style canvas (custom) | DEFER — overkill for v2 MVP |
| Konva.js / Fabric.js | SKIP — 2D canvas libraries, wrong for HTML rendering |
