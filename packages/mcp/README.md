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

- `calca mcp` — serve the canvas tool contract over stdio (`canvas.read`, `canvas.propose`, `canvas.apply`, `canvas.lease`, `canvas.release`, `canvas.comment`, `canvas.arrange`). `--file` loads/saves a JSON snapshot; `--agent` sets the principal id used for command origins and leases.
- `calca mcp install <host>` — merge `calca` into the host's MCP config. Hosts: `claude-code`, `cursor`, `gemini-cli`, `opencode`, `codex`.
- `calca open <file>` — board summary (record counts by type). Full visual open lands with the web build (Phase 3).

## License

Apache-2.0
