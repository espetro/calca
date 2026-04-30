# platforms/desktop/AGENTS.md — Electrobun Desktop App Guidelines

> Guidelines for the Calca desktop app built with Electrobun. See root [AGENTS.md](../../AGENTS.md) for universal rules.

---

## Architecture Overview

The desktop app is an **Electrobun wrapper** that bundles the web frontend and provides native desktop capabilities. It uses a **main process (Bun)** + **webview (Chromium)** architecture similar to Electron but with Bun as the runtime.

```
platforms/desktop/
├── src/
│   ├── index.ts              # Main entry point, startup orchestration
│   ├── server.ts             # Embedded HTTP server (Bun.serve)
│   ├── window.ts             # BrowserWindow + RPC bridge setup
│   ├── menu.ts               # Native application menu
│   ├── updater.ts            # Auto-updater logic
│   ├── storage.ts            # User data directory setup
│   ├── logger.ts             # Logtape configuration
│   ├── version.ts            # Version from package.json
│   ├── error-page.ts         # Fallback error pages
│   ├── constants.ts          # App constants (ports, URLs, dimensions)
│   └── shared/
│       └── types.ts          # RPC schema (single source of truth)
├── scripts/
│   ├── build.ts              # Build script (zx-based)
│   └── verify.ts             # Smoke test script
├── electrobun.config.ts      # Electrobun build configuration
├── calca.iconset/            # macOS app icons
└── package.json
```

**Build pipeline:** clean → web build (`bun run --filter=@app/web build`) → copy to `Resources/web/` → `electrobun build --env=stable`. See `scripts/build.ts` for details.

---

## Core Identity Rules

**Electrobun ≠ Electron.** They share similar concepts but have different APIs.

| Concept | Electrobun | Electron |
|---------|------------|----------|
| Main process runtime | Bun | Node.js |
| IPC mechanism | RPC via `defineRPC` | ipcMain/ipcRenderer |
| Import path | `electrobun/bun` (main) / `electrobun/view` (renderer) | `electron` |
| Window class | `BrowserWindow` | `BrowserWindow` |
| Webview class | `BrowserView` | `BrowserView` (deprecated) |

```typescript
// Main process — import from electrobun/bun
import { BrowserWindow, BrowserView, Updater, ApplicationMenu, ContextMenu } from "electrobun/bun";
import { Utils } from "electrobun";

// Renderer — import from electrobun/view
import { Electroview } from "electrobun/view";
```

**Never import from `electron`.** Docs: [blackboard.sh/electrobun/docs/apis/browser-window](https://blackboard.sh/electrobun/docs/apis/browser-window/)

---

## Dev vs Production Mode

Detection via `Updater.localInfo.channel()` — **not** `NODE_ENV`:

```typescript
const channel = await Updater.localInfo.channel().catch(() => "unknown");
const devMode = channel === "dev";
```

| Mode | Webview URL | API Requests | Static Assets |
|------|-------------|--------------|---------------|
| Dev | `VITE_DEV_URL` (http://localhost:5173) | Proxied to Vite | Vite HMR |
| Prod | `http://localhost:{port}` (OS-assigned) | Handled by embedded server | `Resources/web/` |

**Dev flow:** `bun run dev:desktop` → `bun run --parallel web-dev electrobun-watch` → Vite starts, Electrobun probes via `waitForServer()`, then creates window. **Prod flow:** embedded server (`port: 0`) serves bundled web assets from `Resources/web/`.

---

## RPC Bridge Pattern

**Schema (single source of truth):** `src/shared/types.ts`

**Usage:** `BrowserView.defineRPC<CalcaRPCSchema>()` on bun side, `Electroview.defineRPC()` on renderer side. Handlers defined in `src/window.ts`, implementations in `src/updater.ts`.

**Rules:**
1. **Always wrap handlers in try/catch** — unhandled exceptions crash the main process
2. **Never return stack traces to renderer** — log errors, return structured `{ error: string }` objects
3. **Null-check renderer side** — `window.rpc?.request.method()` in case connection is lost

Docs: [defineRPC (bun side)](https://blackboard.sh/electrobun/docs/apis/browser-view/#browserviewdefinerpc) | [defineRPC (renderer)](https://blackboard.sh/electrobun/docs/apis/browser/electroview-class/#definerpc)

---

## Embedded HTTP Server

`src/server.ts` — `Bun.serve({ port: 0, hostname: "localhost" })`. Routes: `/api/*` and `/health` → `@app/server` (Hono); dev mode `/*` → Vite proxy; prod mode `/*` → static files from `Resources/web/`.

**Rules:**
1. **Always use `port: 0`** — OS assigns an available port, avoiding conflicts
2. **Path traversal prevention** — validate resolved paths start with `STATIC_DIR` (see `serveStaticFile()`)
3. **SPA fallback** — unknown routes serve `index.html`
4. **Health endpoint** — `/health` returns 200 OK for readiness checks
5. **MIME types map** — defined in `server.ts` for all static asset types

---

## Process Management

```bash
bun run dev:desktop    # bun run --parallel web-dev electrobun-watch (Bun handles CTRL+C cleanup)
bun run build:desktop  # Self-contained: web build → copy → electrobun build
bun run verify         # Smoke test: server health, window creation, RPC response
```

**Rules:**
- Use `bun run --parallel` for dev — no custom process orchestrators, no `concurrently`
- Use `bun --cwd <dir> run <script>` for cross-directory scripts — never `process.chdir()` or zx `cd()`
- Build must be self-contained — no manual web build step required

---

## Error Handling

1. **Main process fatal guard** — `main().catch()` in `src/index.ts` calls `process.exit(1)`
2. **No empty catch blocks** — always log or handle explicitly
3. **No stack trace leaks** — don't send `error.stack` to webview
4. **Structured RPC errors** — return `{ error: string }` objects, not thrown exceptions

---

## Logging

**Logtape** with hierarchical categories: `["calca", "desktop", "<module>"]` (e.g. `["calca", "desktop", "server"]`). Two sinks: console + rotating file (daily, 7-day retention). See `src/logger.ts` for configuration.

**Rules:**
1. **Mask sensitive data** — never log tokens, passwords, API keys
2. **Use tagged templates** — `log.info\`Message with ${value}\``
3. **Hierarchical categories** — `["calca", "desktop", "<module>"]`

---

## Storage & Persistence

Use `Utils.paths.userData` for user data (macOS: `~/Library/Application Support/Calca`). **Never hardcode paths.** Atomic writes (write temp, then rename). Version data files for migrations. Storage failures are non-fatal.

Docs: [Utils.paths](https://blackboard.sh/electrobun/docs/apis/utils/#paths)

---

## Build Configuration

See `electrobun.config.ts`. Key rules:

- **CEF** bundled only in dev builds (`bundleCEF: !isBuild`) — saves ~50MB in release
- **CDP** bound to `127.0.0.1` only, dev builds only — never `0.0.0.0`
- **Version** pulled from `package.json` — single source of truth
- **Signing** via env vars: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` (CI only)
- **No `preBuild`/`postBuild` hooks** — supply chain risk; use explicit build scripts

Docs: [Updater API](https://blackboard.sh/electrobun/docs/apis/updater/) | [Updates guide](https://blackboard.sh/electrobun/docs/guides/updates)

---

## Dependencies

**Rules:**
1. **Electrobun pinned** — exact version (`1.16.0`), no `^` or `~`
2. **zx build-only** — never import in runtime code (`src/`)
3. **No runtime web deps** — desktop is standalone, don't bundle React/Vite

See `package.json` for current versions.

---

## Guardrails — MUST NOT

| Forbidden Pattern | Reason | Correct Alternative |
|--------------------|--------|---------------------|
| `process.chdir()` | Breaks when run from different CWDs | `--cwd` flag or `import.meta.dirname` |
| `cd()` from zx | Same as above | `bun --cwd <dir> run <script>` |
| `@ts-nocheck` / `@ts-ignore` | Hides type errors | Fix the actual type error |
| `require()` | ESM-only project | `import` |
| `console.log()` | Unstructured logging | `getLogger()` with Logtape |
| Empty catch blocks | Hides errors | Log or handle explicitly |
| Hardcoded ports | Port conflicts | `port: 0` for OS assignment |
| `NODE_ENV` for dev detection | Unreliable in desktop | `Updater.localInfo.channel()` |
| Importing from `electron` | Wrong framework | `electrobun/bun` or `electrobun/view` |
| `preBuild`/`postBuild` hooks | Supply chain risk | Explicit build scripts |
| `.bak` files in repo | Debug artifacts | Delete before commit |

---

## Known Limitations & Future Work

- [ ] Window state persistence (position, size, maximize state)
- [ ] URL filtering (block navigation to external domains)
- [ ] Splash screen during startup
- [ ] Custom type declarations for Electrobun APIs
- [ ] CSP headers for webview
- [ ] Native notifications
- [ ] Settings persistence across sessions

---

## Related Guides

- [apps/web/AGENTS.md](../../apps/web/AGENTS.md) — Web frontend
- [apps/server/AGENTS.md](../../apps/server/AGENTS.md) — API server
- [packages/shared/AGENTS.md](../../packages/shared/AGENTS.md) — Shared types
- [Electrobun Architecture](https://blackboard.sh/electrobun/docs/guides/architecture/overview) — Official architecture guide
