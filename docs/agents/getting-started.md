# Using calca from your coding agent

Calca is an open, file-based canvas that any agent can drive. Your coding agent connects to it over MCP, proposes design changes on a board, and applies what you accept. This guide gets you from zero to a working propose/apply loop in about five minutes.

## Prerequisites

- Bun or Node >= 20.
- An agent host: Claude Code, Codex, Cursor, Gemini CLI, or OpenCode.

## Install

```bash
# as a dev dependency of your project
bun add -D @calca/mcp

# or globally
npm i -g @calca/mcp
```

The package provides the `calca` CLI and an MCP server over stdio.

## Connect your agent

One command per host. It merges a `calca` entry into the host's MCP config:

```bash
calca mcp install claude-code   # ~/.claude.json
calca mcp install codex         # ~/.codex/config.toml
calca mcp install cursor        # ~/.cursor/mcp.json
calca mcp install gemini-cli    # ~/.gemini/settings.json
calca mcp install opencode      # ~/.config/opencode/opencode.json
```

Use `--print` to preview the config fragment without writing. Restart your agent and the `canvas.*` tools appear in its tool list. The installed entry runs `npx -y @calca/mcp@latest mcp`, so it always uses the latest published version.

## The board file

A board is a JSON file holding the canvas records. The server loads it with `--file` and autosaves on every change:

```bash
calca mcp --file ./board.json --agent my-agent
```

- Start from `{"shapes":[],"bindings":[]}`, or point `--file` at a path that does not exist yet: the server starts empty and creates the file on first save.
- `--agent` sets the principal id used for command origins and leases. Give each agent a distinct id when running more than one.
- Inspect a board from the shell at any time: `calca open ./board.json` (prints record counts by type).

## The propose / apply loop

All agent mutations are proposals by default. Nothing touches the board until you apply.

1. **Propose.** The agent calls `canvas.propose` with a title, rationale, and a batch of commands. It gets back a proposal id; the board is unchanged.
2. **Review.** Open the board in the Calca app, or have the agent call `canvas.read` (scope `summary` first). The agent can annotate records with `canvas.comment` and lay frames out with `canvas.arrange`.
3. **Apply.** Accepted proposals are landed with `canvas.apply` (passing the `proposalId`). Applies are atomic and idempotent: a repeated `requestId` is a no-op.

For longer multi-turn work the agent should take soft leases with `canvas.lease` (TTL clamped to 30 s) on the records it is iterating on, and `canvas.release` when done, so concurrent agents do not collide.

To compare design directions, prefer `canvas.show_variations`: one call pushes up to 8 HTML variations as a titled side-by-side group.

## Tools

| Tool                     | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `canvas.read`            | Read canvas state (scope: `summary`, viewport, selection, or full).               |
| `canvas.apply`           | Apply canvas commands immediately; can land a pending proposal via `proposalId`.  |
| `canvas.propose`         | Default mutation mode: record a proposal without mutating.                        |
| `canvas.lease`           | Take exclusive soft leases on record ids (max 30000 ms).                          |
| `canvas.release`         | Release this principal's leases early.                                            |
| `canvas.comment`         | Attach a comment to a record.                                                     |
| `canvas.arrange`         | Lay out shapes as a `row`, `column`, or `grid`.                                   |
| `canvas.show_variations` | Create a titled group of design variations side by side (max 8).                  |
| `canvas.formats`         | List the output formats available to the session.                                 |

## Custom formats

Formats tell the agent how to frame generated artifacts: which stylesheets to load, which theme attributes to set, and extra prompt guidance. They are JSON manifests.

Discovery (verified in `packages/format/src/discovery.ts`):

1. The server walks from the working directory upward, collecting every `<dir>/.calca/formats` it finds, stopping at the filesystem root and the home directory.
2. `~/.calca/formats` is always the lowest-priority fallback.
3. Nearest definition wins when the same format id exists in several directories.
4. `CALCA_FORMATS=<dir>` or `calca mcp --formats <dir>` disables discovery and loads one directory.

### daisyUI example

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

The agent's output is rendered in a sandboxed frame with daisyUI loaded and `data-theme="light"` set, and the prompt snippet steers generation toward daisyUI classes.

### shadcn token example

`.calca/formats/shadcn.json`:

```json
{
  "id": "shadcn",
  "extends": "html-tailwind",
  "exporters": ["html"],
  "frameEnv": {
    "styles": ["./tokens.css"],
    "customCssPassthrough": true
  },
  "promptSnippets": {
    "layout": "Use the shadcn CSS variables (--background, --foreground, --primary, --radius) instead of raw Tailwind colors. Wrap components in class 'p-4 rounded-lg border'."
  }
}
```

`.calca/formats/tokens.css` (the actual shadcn default theme variables):

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
}
```

Load either example with `calca mcp --formats ./.calca/formats`, or drop the directory into `~/.calca/formats` to make it global. The agent can list what is loaded with `canvas.formats`.

## Teach your agent the workflow

The package ships an agent skill that encodes the full loop (read, propose, review, apply, leases, variations, formats):

```bash
calca skill --copy ~/.claude/skills/   # or your host's skill directory
calca skill                            # prints the path instead of copying
```

Source: [packages/mcp/skills/calca-design-exploration/SKILL.md](../../packages/mcp/skills/calca-design-exploration/SKILL.md).

## Further reading

- [packages/mcp/README.md](../../packages/mcp/README.md) — tool reference and format discovery details.
- [docs/mcp.md](./mcp.md) — agents and MCP overview.
