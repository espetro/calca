# Desktop Shell (Electrobun)

| Attribute | Value |
|-----------|-------|
| Source | `docs/prd-v2.md` Feature 7 (Section 3) |
| Priority | **P0** |
| Status | Planned — not yet implemented |

## Description

Launch Gosto as a native desktop application using Electrobun wrapper, providing native menus, keyboard shortcuts, system tray integration, and auto-update for a desktop-first user experience. This is MVP-critical per the PRD, despite POC learnings initially deferring desktop due to early-stage Electrobun maturity.

## Dependencies

- **Shared Packages** — Imports from `packages/shared` for types and contracts
- **Desktop-specific IPC** — Bridge between desktop shell and web app
