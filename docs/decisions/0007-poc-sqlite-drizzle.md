# 0007 — POC: SQLite + Drizzle over localStorage/IndexedDB

| Attribute | Value |
|-----------|-------|
| Status | **CARRY** (POC verdict) |
| Date | 2026-04-05 |
| Decision | Recommended for v2 — server-side persistence replaces client-side storage |

## Context

The current persistence layer:

### localStorage
- **Settings** (`otto-settings`) — API keys, model preference, system prompts, concept count
- **Canvas session** (`otto-canvas-session`) — All `GenerationGroup[]` data (stripped of base64)

### IndexedDB (`otto-canvas-images`)
- **Base64 images** — Extracted from HTML to avoid localStorage size limits (5-10MB)
- **Restore on load** — `postMessage`-based rehydration of images into design HTML

### Problems with Current Approach
1. **5-10MB limit** — localStorage fills up fast with design sessions
2. **No query capability** — Can't search/filter designs by date, prompt, tags
3. **No sharing** — Designs locked to a single browser
4. **Fragile persistence** — IndexedDB can be cleared by browser cleanup
5. **Complex base64 handling** — Extract/restore dance for every save/load cycle (see `use-persisted-groups.ts`, 157 lines)
6. **No schema evolution** — No migrations when data types change

## Decision

**Carry forward.** SQLite + Drizzle is the right persistence strategy for v2, especially for desktop.

## Rationale

### Why SQLite
1. **Desktop-native** — For Electrobun/Tauri desktop app, SQLite is the standard local DB
2. **Zero config** — No server process, file-based, included in better-sqlite3 or bun:sqlite
3. **Full SQL** — Query designs by date, search prompts, aggregate stats
4. **Transactions** — Atomic saves, no partial state
5. **Migrations** — Schema evolution via Drizzle migration files
6. **No size limits** — GB-scale without browser storage constraints

### Why Drizzle ORM
1. **Type-safe** — Schema definitions generate TypeScript types
2. **Lightweight** — Minimal runtime overhead vs Prisma
3. **SQL-like** — Drizzle queries look like SQL, easy to reason about
4. **Bun-compatible** — Works with `bun:sqlite` natively
5. **Migrations** — Built-in migration generation and management
6. **Relations** — Supports relationships (designs → iterations → comments)

## Proposed Schema (v2 Target)

```typescript
// designs table
{
  id: text (uuid),
  prompt: text,
  style: text,
  createdAt: integer (timestamp),
  updatedAt: integer (timestamp),
  metadata: text (json),
}

// iterations table
{
  id: text (uuid),
  designId: text (fk → designs),
  html: text,
  width: integer,
  height: integer,
  positionX: real,
  positionY: real,
  label: text,
  order: integer,
  createdAt: integer (timestamp),
}

// comments table
{
  id: text (uuid),
  iterationId: text (fk → iterations),
  positionX: real,
  positionY: real,
  text: text,
  status: text (waiting | working | done),
  number: integer,
  createdAt: integer (timestamp),
}

// comment_messages table
{
  id: text (uuid),
  commentId: text (fk → comments),
  role: text (user | otto),
  text: text,
  createdAt: integer (timestamp),
}

// settings table
{
  key: text (primary),
  value: text,
  updatedAt: integer (timestamp),
}
```

## Migration Path

1. **Phase 1** — Add Drizzle + SQLite as server-side persistence, keep localStorage as fallback
2. **Phase 2** — Migrate settings from localStorage → SQLite
3. **Phase 3** — Migrate design sessions from localStorage/IndexedDB → SQLite
4. **Phase 4** — Remove localStorage/IndexedDB dependencies

## Consequences

### Positive
- Reliable persistence (no browser storage limits)
- Query capability (search designs, filter by date)
- Schema migrations (evolve data model without data loss)
- Desktop-ready (SQLite is standard for local apps)
- Sharing potential (export/import from DB)

### Negative
- Requires server process (even locally) for DB access
- Initial migration complexity from localStorage
- Added dependency (drizzle-orm, better-sqlite3 or bun:sqlite)

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| localStorage + IndexedDB (current) | WORKS but fragile, limited |
| SQLite + Drizzle | CARRY — right for desktop + server |
| SQLite + Prisma | SKIP — heavier, worse Bun support |
| IndexedDB via Dexie.js | SKIP — still client-side, no server queries |
| PostgreSQL + Drizzle | OVERKILL — unnecessary for desktop/local use |
