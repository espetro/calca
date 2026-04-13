# Canvas Enhancements

| Attribute | Value |
|-----------|-------|
| Source | `docs/decisions/0006-poc-react-flow-canvas.md` |
| Priority | **P1/P2** |
| Status | Planned — not yet implemented |

## Description

Upgrade the current CSS transform canvas with virtualization (P1), minimap (P1), undo/redo (P2), and connection lines (P2) to support large canvases and better navigation. React Flow was rejected per ADR 0006 — CSS transforms are preserved with targeted enhancements via @tanstack/virtual and custom overlays.

## Dependencies

- **Canvas State Refactor** — Centralize pan/zoom, selection, and design state into custom hooks
- **Database Persistence** — Undo/redo history requires database storage
- **Post-MVP Features** — Connection lines enable visual iteration tracking
