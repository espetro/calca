# @calca/mcp

The `calca` CLI — Layer 2 of the Calca stack: an MCP playground that lets AI agents read and edit a canvas board over the Model Context Protocol.

The pure tool surface (session, commands, leases, proposals, idempotency) lives in [`@calca/mcp-core`](../mcp-core) and is runtime-neutral; this package is the Node-facing binding: stdio transport, board-file persistence, host config installers.

## Install / run

```bash
npx -y @calca/mcp mcp            # run the MCP server over stdio
npx -y @calca/mcp mcp --file board.json   # load a board, autosave on change
npx -y @calca/mcp open board.json         # inspect a board snapshot
npx -y @calca/mcp mcp install claude-code # write host config (prints with --print)
```

## Commands

- `calca mcp` — serve the canvas tool contract over stdio (see the tool table below). `--file` loads/saves a JSON snapshot; `--agent` sets the principal id used for command origins and leases.

### Tools

| Tool                     | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `canvas.read`            | Read canvas state (summary / viewport / selection / full)                |
| `canvas.apply`           | Apply canvas commands immediately                                        |
| `canvas.propose`         | Record a proposal (default mutation mode)                                |
| `canvas.lease`           | Take exclusive soft leases on record ids                                 |
| `canvas.release`         | Release this principal's leases                                          |
| `canvas.comment`         | Attach a comment to a record                                             |
| `canvas.arrange`         | Lay out shapes as row / column / grid                                    |
| `canvas.show_variations` | Create a titled group of design variations laid out side by side (max 8) |

- `calca mcp install <host>` — merge `calca` into the host's MCP config. Hosts: `claude-code`, `cursor`, `gemini-cli`, `opencode`, `codex`.
- `calca open <file>` — board summary (record counts by type). Full visual open lands with the web build (Phase 3).

## License

Apache-2.0

## Custom formats

Output formats are declarative JSON manifests describing how an artifact is framed (scripts, styles, theme attributes) and which exporters it supports. They are discovered from `.calca/formats` directories.

### Discovery rules

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

Load it with `calca mcp --formats ./.calca/formats`, or drop it into `~/.calca/formats` to make it available everywhere.
