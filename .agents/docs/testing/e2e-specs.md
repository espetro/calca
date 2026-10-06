# E2E Test Specs

Tests use **Gauge** (Markdown specs, `gauge-ts`) driving **agent-browser** against the running Vite app.
Steps are defined in `e2e/steps/` (implementation in TypeScript classes with `@Step` decorators).

## Running tests

```bash
# Prereqs, once: bun install (pulls gauge-cli, agent-browser, gauge-ts)
# Servers needed: Vite on :5173 (or whatever BASE_URL points at) and apps/server on :3001
bun run --cwd apps/web dev &
bun run --cwd apps/server dev &

bun run test:e2e                          # all specs in e2e/specs (deterministic suite)
bun run test:e2e:spec e2e/specs/login.md  # single spec
```

`e2e/benchmarks/` holds wall-clock-bound scenarios (real-model generation
latency). They are excluded from the default suite — run them explicitly with
`gauge run e2e/benchmarks` (nightly / pre-release).

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

## Built-in steps (e2e/steps/common.ts, prompt-bar.ts, settings.ts)

| Step                                              | Notes                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `Open <url>`                                      | `"/"`, `"/?quickMode=true"` — relative to `BASE_URL` (default :5173) |
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

## Environment

- `BASE_URL` — defaults to `http://localhost:5173`
- Generation specs need a real provider: run Vite with `VITE_AI_BASE_URL`, `VITE_AI_API_KEY`, `VITE_AI_MODEL` set (the env-injected provider). Text-only models reject image-input — clear attachments before generation specs.
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
