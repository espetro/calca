# Agents & MCP

The `calca` CLI ships the canvas as a set of MCP tools, so agent hosts —
Claude Code, Cursor, Gemini CLI, OpenCode, Codex — can read a board, propose
changes, apply them under leases, comment, and arrange frames.

## Install into your agent host

```bash
npx -y @calca/mcp mcp install claude-code
```

Supported hosts: `claude-code`, `cursor`, `gemini-cli`, `opencode`, `codex`.
The command merges a `calca` entry into the host's MCP config (prints instead
of writing with `--print`):

```json
{ "command": "npx", "args": ["-y", "@calca/mcp@latest", "mcp"] }
```

Restart the host and `calca` tools appear in its tool list.

## Tool surface

| Tool | What it does |
| --- | --- |
| `canvas.read` | Read the board — records, bounds, comments |
| `canvas.propose` | Stage a batch of edits for review (proposal id) |
| `canvas.apply` | Apply a proposal atomically, idempotently |
| `canvas.lease` / `canvas.release` | Claim/release records before mutating |
| `canvas.comment` | Attach a comment thread to a record |
| `canvas.arrange` | Lay out records (grid, row, column) |

Proposals, leases, request ids, and operation bounds are enforced by
`@calca/mcp-core`, so concurrent agents can't silently clobber each other.

## Work on a board file

```bash
# serve a board over stdio, autosaving changes
npx -y @calca/mcp mcp --file board.json

# inspect a snapshot: record counts by type
npx -y @calca/mcp open board.json
```

Board files are plain JSON snapshots — diffable, commitable, and shareable.
Export one from the app (Toolbar → Export) and hand it to your agent.

::: callout info
A visual `calca open` that renders boards in the web app lands with the Phase 3
app integration — today `open` prints a summary.
:::
