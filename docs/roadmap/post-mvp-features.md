# Post-MVP Features

| Attribute | Value |
|-----------|-------|
| Source | `docs/prd-v2.md` Section 4 (Line 299-343) |
| Priority | **P1/P2** |
| Status | Planned — not yet implemented |

## Description

Post-MVP features expand Calca beyond single-user desktop use, adding collaboration, cloud sync, mobile optimization, and accessibility. These are designed for subsequent releases after the MVP is stable.

## Feature Summary

| Feature | Priority | Brief |
|---------|----------|-------|
| Multi-User Collaboration | P1 | Real-time multi-user editing via WebSocket with cursor tracking, conflict resolution (OT/CRDT), room-based workspaces, and permissions. |
| Component Library | P1 | Save and reuse generated designs as versioned, nestable components with a drag-and-drop palette. |
| Design System Enforcement | P1 | Shared design tokens (colors, typography, spacing) injected into the AI generation pipeline for consistent outputs. |
| Enhanced Canvas | P1 | Minimap, nested frames, connection lines, and virtualization — see `canvas-enhancements.md` for details. |
| Advanced Export Formats | P1 | Figma plugin, vanilla CSS, Vue SFC, and Sketch export beyond MVP formats. |
| Cloud Sync | P1 | Optional cloud storage with team workspaces, automatic sync, and conflict resolution. |
| Mobile Optimization | P1 | Touch gestures, responsive design, and PWA support for on-the-go access. |
| Accessibility | P1 | WCAG 2.1 AA compliance with screen reader support, keyboard-only navigation, and ARIA labels. |

## Dependencies

- **Database** — Required by collaboration, component library, and cloud sync
- **Canvas Enhancements** — Required by enhanced canvas features, mobile touch gestures, and accessibility keyboard nav
- **Multi-User Collaboration** — Required by cloud sync for real-time features
