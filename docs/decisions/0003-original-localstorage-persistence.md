# 0003 — Use localStorage + IndexedDB for Client-Side Persistence

| Attribute | Value |
|-----------|-------|
| Status | **DEPRECATED** |
| Superseded By | ADR 0007 (SQLite + Drizzle) |

> **Note:** SQLite + Drizzle (ADR 0007) is the target persistence layer but is **NOT YET IMPLEMENTED**. The current app uses no persistent database — state is session-based (in-memory).

## Context and Problem Statement

Otto Canvas is a client-side-only application with no backend database, no user accounts, and no server-side state. Users generate design iterations (HTML/CSS content with embedded base64 images), configure API keys and settings, and drag reference images onto the canvas. All of this state must persist across browser sessions without requiring any server infrastructure.

The persistence layer must handle:
- **Settings** (API keys, model selection, system prompts) — Small JSON object, frequently updated
- **Design groups and iterations** — Large HTML strings with embedded images, grows with usage
- **Canvas reference images** — Binary image data (base64 data URIs), up to 20 images
- **Onboarding state** — Small flags tracking user progress

localStorage has a ~5MB limit per origin, and design iterations contain base64-encoded images that can easily exceed this.

## Decision Drivers

* **Zero infrastructure** — No database, no authentication, no hosting costs for persistence
* **Offline capability** — Data must survive browser restarts without network
* **Simplicity** — Solo developer, minimal complexity preferred
* **Data size** — Base64 images in HTML can be large (100KB-1MB+ per iteration)
* **Performance** — Reads must be fast for canvas initialization, writes must not block UI

## Considered Options

* **localStorage + IndexedDB hybrid** — Small metadata in localStorage, large binaries in IndexedDB
* **IndexedDB only** — All data in IndexedDB for consistency
* **Cloud storage (Firebase/Supabase)** — Backend database for persistence
* **File-based export/import only** — No auto-persistence, user manually saves/loads
* **OPFS (Origin Private File System)** — Modern browser filesystem API

## Decision Outcome

Chosen option: **"localStorage + IndexedDB hybrid"**

### Storage Architecture

| Data | Storage | Key | Strategy |
|------|---------|-----|----------|
| Settings | `localStorage` | `otto-settings` | Direct JSON stringify/parse |
| Design groups | `localStorage` | `otto-canvas-session` | Base64 images stripped from HTML, stored in IndexedDB |
| Design images | `IndexedDB` (`otto-canvas-images`, store: `images`) | `img_{groupId}_{iterId}_{counter}` | Base64 data URIs extracted from HTML |
| Reference images | `IndexedDB` (`otto-canvas-images`, store: `ref-images`) | `canvas-images` | Compressed to 800px JPEG 60%, max 20 images |
| Onboarding state | `localStorage` | `otto-onboarding` | Simple JSON flags |

The key insight: HTML content contains `<img src="data:image/...">` tags with base64 data. Before saving to localStorage, base64 URIs are replaced with `[idb:key]` references, and the actual data goes to IndexedDB. On load, references are restored.

Writes are debounced (500ms) to prevent performance issues during rapid state changes.

### Consequences

* Good: Zero infrastructure — no database costs, no auth, no server maintenance
* Good: Works offline — all data is local, no network dependency
* Good: Simple mental model — localStorage for JSON, IndexedDB for binary blobs
* Good: Fast reads — localStorage is synchronous, IndexedDB loads are async but cached in React state
* Bad: **5MB localStorage limit** — Even with image extraction, large sessions with many iterations can hit the limit. No error handling beyond try/catch.
* Bad: **Data loss risk** — Clearing browser data wipes everything. No backup, no sync, no recovery.
* Bad: **No cross-device sync** — Designs are locked to one browser. Users cannot access their work from another machine.
* Bad: **IndexedDB complexity** — The base64 extraction/restoration logic is fragile. The `extractBase64()` and `restoreBase64()` functions must stay in sync with HTML structure.
* Bad: **No collaboration** — Client-only storage means no sharing or multi-user workflows
* Bad: **Performance degradation** — As sessions grow, the debounced JSON.stringify of the entire group state becomes expensive
