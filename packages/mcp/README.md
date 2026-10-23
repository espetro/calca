# @calca/mcp

The `calca` CLI — Layer 2 of the Calca stack: an MCP playground that lets AI agents read and edit a canvas board over the Model Context Protocol.

The pure tool surface (session, commands, leases, proposals, idempotency) lives in [`@calca/mcp-core`](../mcp-core) and is runtime-neutral; this package is the Node-facing binding: stdio transport, board-file persistence, host config installers.

## Quick start

Requires Bun or Node >= 20.

```bash
# Install as a dev dependency of your project
bun add -D @calca/mcp

# ...or install globally
npm i -g @calca/mcp
```

Run the MCP server over stdio, bound to a board file:

```bash
calca mcp --file ./board.json
```

Install into an agent host (supported hosts: `claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`):

```bash
calca mcp install claude-code
```

Verify the board is readable:

```bash
calca open ./board.json
```

### The 5-minute loop

1. **Propose.** The agent calls `canvas.propose` with a title, rationale, and a batch of commands. Nothing is mutated yet; the call returns a proposal id.
2. **Review.** Read the proposal with `canvas.read` (scope `summary` shows counts and pending proposals). Leave feedback with `canvas.comment`.
3. **Apply.** Land the proposal with `canvas.apply` and its `proposalId`. Commands run atomically and idempotently (a repeated `requestId` is a no-op).

If you don't have a board yet, point `--file` at a path that doesn't exist: the server starts empty and writes the file on first save. A minimal board is `{"shapes":[],"bindings":[]}` (note: `shapes`/`bindings`, not `records`; `records` is what `calca open` reports).

## Commands

- `calca mcp` — serve the canvas tool contract over stdio (see the Tools section below). `--file` loads/saves a JSON snapshot with autosave on change; `--agent` sets the principal id used for command origins and leases; `--formats <dir>` loads format manifests from a specific directory.
- `calca mcp install <host>` — merge `calca` into the host's MCP config. Hosts: `claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`. Prints the config instead of writing with `--print`.
- `calca open <file>` — board summary (record counts by type). Full visual open lands with the web build (Phase 3).
- `calca skill` — print the path of the bundled agent skill (`calca-design-exploration`). `calca skill --copy <dir>` copies the skill folder into `<dir>` instead.

## Tools

All tools are namespaced `canvas.*`. Names and semantics come from the contract in [`@calca/mcp-core`](../mcp-core/src/contract.ts):

| Tool                     | Description                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `canvas.read`            | Read canvas state (scope: `summary`, viewport, selection, or full).                       |
| `canvas.apply`           | Apply canvas commands immediately; can land a pending proposal via `proposalId`.          |
| `canvas.propose`         | Default mutation mode: record a proposal (title + rationale + commands) without mutating. |
| `canvas.lease`           | Take exclusive soft leases on record ids (TTL clamped to 30000 ms).                       |
| `canvas.release`         | Release this principal's leases on the given record ids early.                            |
| `canvas.comment`         | Attach a comment to a record (creates a `comment` shape record).                          |
| `canvas.arrange`         | Lay out shapes as a `row`, `column`, or `grid` with an optional gap.                      |
| `canvas.show_variations` | Create a titled group of design variations laid out side by side (max 8).                 |
| `canvas.formats`         | List the output formats available to the session.                                         |

## Custom formats

Output formats are declarative JSON manifests describing how an artifact is framed (scripts, styles, theme attributes) and which exporters it supports. They are discovered from `.calca/formats` directories.

### Discovery rules

Verified against `packages/format/src/discovery.ts`:

1. Starting at the working directory, every ancestor directory is checked for `<dir>/.calca/formats`. The walk never stops at repository boundaries (`.git` is irrelevant) and terminates at the filesystem root and at the user's home directory.
2. `<home>/.calca/formats` is always appended as the last (lowest-priority) source.
3. Directories are merged nearest-first: when the same format id appears in several directories, the deepest (nearest) definition wins.
4. A manifest may `extends` another format id. When that id is present in the loaded chain, the frame env is resolved parent-first (defaults applied last).
5. Setting `CALCA_FORMATS=<dir>` disables discovery and loads that single directory verbatim.
6. `calca mcp --formats <dir>` loads that directory as the single source for the session, overriding discovery.

Malformed manifests are skipped with a warning; they never abort the session.

### `canvas.formats` tool

Read-only tool listing the formats available to the session:

```json
{
  "formats": [
    {
      "id": "daisy",
      "extends": "html-tailwind",
      "exporters": ["html"],
      "frameEnv": { "styles": ["daisyui.css"], "attrs": { "data-theme": "light" } },
      "promptSnippets": { "layout": "use daisyUI component classes" },
      "sourcePath": "/path/to/.calca/formats/daisy.json"
    }
  ],
  "warnings": []
}
```

### Example: daisyUI manifest

`.calca/formats/daisy.json`:

```json
{
  "id": "daisy",
  "extends": "html-tailwind",
  "exporters": ["html"],
  "frameEnv": {
    "styles": ["https://unpkg.com/daisyui@5/daisyui.css"],
    "attrs": { "data-theme": "light" },
    "customCssPassthrough": true
  },
  "promptSnippets": {
    "layout": "Build the UI with daisyUI component classes (btn, card, navbar, modal)."
  }
}
```

With a local copy of the stylesheet instead of the CDN URL, `daisyui.css` sits next to the manifest:

```css
/* .calca/formats/daisyui.css */
@import "https://cdn.jsdelivr.net/npm/daisyui@5/themes.css";

:root {
  --btn-border: 0px;
}
```

Load it with `calca mcp --formats ./.calca/formats`, or drop it into `~/.calca/formats` to make it available everywhere.

## Agent skill

The package ships a skill that teaches an agent how to work a board: [skills/calca-design-exploration/SKILL.md](./skills/calca-design-exploration/SKILL.md). Copy it into your host's skill directory:

```bash
calca skill --copy ~/.claude/skills/
```

## License

Apache-2.0
