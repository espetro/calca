# E2E Test Specs

Tests use **Gauge** (Markdown specs, `gauge-ts`) driving **agent-browser** against the running app.
Steps are defined in `e2e/steps/` (implementation in TypeScript classes with `@Step` decorators).

## Two API runtimes

The app has two API topologies (issue #74), and the suite covers both:

| Mode            | Topology                                                                   | Command                |
| --------------- | -------------------------------------------------------------------------- | ---------------------- |
| **server**      | Vite dev server on :5173, `/api` proxied to `apps/server` on :3001         | `bun run test:e2e`     |
| **sw** (prod)   | Static `apps/landing/dist` — SPA at `/app/`, API answered by root `/sw.js` | `bun run test:e2e:sw`  |

`test:e2e` is the server-backed mode (the desktop dev topology) and skips
specs tagged `sw` (`--tags "!sw"`). `test:e2e:sw` is handled by
`scripts/e2e-sw.ts`, which:

1. seeds `apps/landing/public/` into `dist/` (favicons/fonts) and runs
   `bun run build:app` (vite `--base=/app/` → `dist/app/`, `build:sw` → `dist/sw.js`)
   — skip with `E2E_SW_SKIP_BUILD=1` to reuse a dist;
2. serves `dist/` on `E2E_SW_PORT` (default 8899) with static-host semantics —
   no SPA fallback, so `/api/*` 404s unless the worker intercepts;
3. runs `gauge run` with `E2E_BASE_URL=http://localhost:$PORT/app/` and
   `E2E_API_MODE=sw` — all specs run, `sw`-tagged ones included.

```bash
# Server-backed mode: Vite on :5173 + apps/server on :3001
bun run --cwd apps/web dev &
bun run --cwd apps/server dev &
bun run test:e2e                          # all specs except `sw`-tagged
bun run test:e2e:spec e2e/specs/login.md  # single spec

# SW-backed mode: builds + serves apps/landing/dist, no dev servers needed
bun run test:e2e:sw                       # full suite against /app/ + /sw.js
bun scripts/e2e-sw.ts e2e/specs/sw-runtime.md  # only the SW spec
bun run test:e2e:sw:bench                 # SW benchmark specs (multi-minute SSE)
```

`e2e/benchmarks/` holds wall-clock-bound scenarios (real-model generation
latency, the multi-minute SSE-through-SW guard). They are excluded from the
default suite — run them explicitly with `bun scripts/e2e-sw.ts e2e/benchmarks`
(SW mode) or `gauge run e2e/benchmarks` (server mode).

`GAUGE_TS_PACKAGE_RUNNER=bun STEP_IMPL_DIR=steps,support` is baked into the npm scripts —
`npx` breaks on `catalog:` overrides, so step resolution runs under bun.

## Writing a spec

Create a `.md` file in `e2e/specs/`. Each H1 is a feature, each H2 is a scenario.
Parameters use `<angle brackets>`; values containing spaces must be quoted.

```markdown
# Checkout Flow

## Guest user can add item to cart

- Open "http://localhost:3000/shop"
- Click "Add to Cart"
- Page should contain "1 item in cart"
```

## Built-in steps (e2e/steps/common.ts, prompt-bar.ts, api-runtime.ts)

| Step                                              | Notes                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `Open <url>`                                      | `"/"`, `"/?quickMode=true"` — joined onto `E2E_BASE_URL` (default :5173, or `…/app/` in SW mode) |
| `Wait for page to load completely`                | Wait for network + render idle                                     |
| `Page should contain <text>` / `… not contain`    | Assert presence / absence in snapshot                              |
| `Wait for <label> to appear`                      | Poll snapshot, default ~30s                                        |
| `Wait up to <seconds> seconds`                    | Fixed sleep                                                        |
| `Click <label>` / `Click the <label> button` / `Click the <label> icon` | Resolves a11y ref from `snapshot`, falls back to `snapshot -i` |
| `Fill <value> in the <label> field`               | Type into named input/textarea                                     |
| `Select <value> in the <label> dropdown`          | Native select                                                      |
| `Press the <key> key`                             | e.g. `Enter`, `Escape`, `ArrowUp`                                  |
| `Reload the page`                                 | Full reload                                                        |
| `Wait for <n> rendered nodes` / `Wait for node <name> to render` | Poll `.react-flow__node` iframes (default 600s)         |
| `Select the first canvas node` / `The first canvas node should have moved` / `The first canvas node should be in the viewport` | Canvas node assertions |
| `Switch to the Select tool`                       | Dispatches the `v` shortcut — **required before dragging nodes**   |
| `Drag the first canvas node`                      | Stepped mouse drag (+120,+80); needs Select mode + a node          |
| `Set the variations count to <value>`             | Clicks the stepper +/- buttons until the count matches (1–4)       |
| `Clear the attachments`                           | Drops `selectedImages` from settings + reloads                     |
| `Hover the <tour> control`                        | `pointerover` — for controls keyed to hover                       |
| `Move the caret to the <pos> of the prompt field` | `start`/`end` — history nav requires caret at a text boundary      |
| `Seed prompt history with <recent> and <older>`   | Writes `calca-prompt-history` localStorage + reloads               |
| `Seed an image attachment named <name>`           | Writes `selectedImages` so the attachment pill appears             |
| `Upload <path> to the media picker`               | File input                                                         |
| `Import <path> as a design file`                  | Builds a `File` in-page via `DataTransfer`, dispatches `change` — deterministic import |
| `Page should show the prompt bar` / `The prompt field should be empty` / `The prompt field should contain <text>` | Prompt-bar assertions           |
| `Dismiss the onboarding dialog` / `Reset the onboarding flag` | Onboarding flow                                    |
| `Open the settings dialog` / `Click outside the modal` / `Scroll to the <label> section` | Settings modal                      |
| `Quick mode should be <state>`                    | `enabled`/`disabled` in settings                                    |
| `The page should have no console errors`          | `agent-browser errors` + error-severity `console` lines must be empty |
| `The page should be controlled by a service worker` | Polls `navigator.serviceWorker.controller` (15 s), asserts `/sw.js` script |
| `In-page fetch <method> <path> should return status <code>` | `fetch()` in page context — e.g. `/health` 200 via the worker, `/api/no-such-route` 404 |
| `In-page fetch <path> should return JSON <key> "<value>"` | Fetch + `res.json()` key assertion                |
| `A provider probe to a dead endpoint should surface an error` | POST `/api/probe-models` at `localhost:1` must not report success |
| `Seed a broken provider`                          | `calca-settings` provider pointing at `localhost:1` — generation must fail visibly |
| `Seed provider credentials from the environment`  | Seeds `calca-settings` from `E2E_AI_*`/`VITE_AI_*`/`CAUCE_AI_*`/`AI_*_PAID`; no-op when a provider is already configured |
| `The canvas should show a generation error`       | Polls node iframe `srcdoc` for the `⚠` failure markup (120 s)      |
| `Wait up to <seconds> seconds for node <name> to render` | `Wait for node` with an explicit timeout — for multi-minute streams |

## Environment

- `E2E_BASE_URL` — app URL the steps open; defaults to `http://localhost:5173`. In SW mode the runner sets it to `http://localhost:8899/app/` — `Open "/"` resolves to the app root in both modes (`appUrl()` joins onto the base path).
- `E2E_API_MODE` — `sw` when running through `test:e2e:sw`, `server` otherwise.
- Generation specs need a real provider: in server mode run Vite with `VITE_AI_BASE_URL`, `VITE_AI_API_KEY`, `VITE_AI_MODEL` set (the env-injected provider). In SW mode those vars must be set **at build time** (vite `define` bakes them) — the `e2e-sw` runner resolves `VITE_AI_*` from `E2E_AI_*`/`CAUCE_AI_*`/`AI_*_PAID` and feeds them to the build. Text-only models reject image-input — clear attachments before generation specs.
- `E2E_SW_SKIP_BUILD=1` — reuse the existing `apps/landing/dist` (fast iteration on specs).
- `E2E_SW_PORT` — static server port for SW mode (default 8899).
- **`?quickMode=true`** — sequential mode takes >5min on slow models (6 serial LLM stages); every spec that waits on rendered output must open `/?quickMode=true` (persisted in settings across reloads). `quickMode` defaults to true, so a wrong param name fails open — always use the real one.

## Isolation & known quirks

- `BeforeSpec` cold-starts each spec file: wipes `localStorage` **and** all IndexedDB databases (`calca-canvas-images` — the blob store `localStorage.clear()` misses). Never rely on state leaking between spec files.
- Refs (`e1`, `e2`…) are ephemeral — `findRef` resolves them right before each `ab()` call; never cache refs across steps.
- Snapshot lines render refs non-bracket-adjacent (`[expanded=false, ref=e168]`) — parse with `ref=(\w+)`, not `\[ref=`.
- Nodes are draggable only in Select mode (`nodesDraggable={isSelectMode}`); React Flow drags need multi-step `mouse move`, not a teleport.
- `agent-browser open` reuses the bound tab — steps can't open parallel windows.
- Gauge failure screenshots may capture an unrelated surface (e.g. a New Tab page); treat them as uninformative unless the app tab is verified dead.
- `agent-browser`'s `upload` command attaches files but its `change` dispatch does not reach React's root-level delegation (and paths resolve against the daemon cwd) — build the `File` in-page (`new File` + `DataTransfer`) and dispatch `new Event('change',{bubbles:true})` instead. Step processes run with `cwd=e2e`; spec paths are repo-root-relative, so resolve both anchors.
- eval/snapshot can land inside a node's sandboxed design iframe (`about:blank`, `localStorage` throws `SecurityError`) — call `ab('frame main')` before eval or selector-based commands to force the main frame.
- Never run `bun run validate` / a `canvas-flow` rebuild concurrently with e2e — Vite reloads the page mid-run and the spec sees a dead tab.

## Naming conventions

- Spec files: `e2e/specs/<feature-name>.md` (kebab-case)
- Step files: `e2e/steps/<feature-name>.ts` (matching the spec)
- Group generic cross-feature steps in `common.ts`
