# Database (SQLite + Drizzle)

| Attribute | Value |
|-----------|-------|
| Source | `docs/decisions/0007-poc-sqlite-drizzle.md` |
| Priority | **P1** |
| Status | Planned — not yet implemented |

## Description

Replace fragile client-side storage (localStorage + IndexedDB) with a server-side SQLite database using Drizzle ORM. This provides reliable persistence, query capability, and schema migrations — essential for desktop use where browser storage limits and the current 157-line base64 extraction/restore dance are unsustainable.

## Dependencies

- **Post-MVP Collaboration** — Multi-user editing requires shared database
- **Cloud Sync** — Database sync enables project sharing across devices
