---
name: calca-design-exploration
description: Explore UI/design variations for a feature on a shared canvas board. Use when comparing design directions side-by-side, generating multiple visual treatments of the same component or page, or handing visual work to a user for review. Drives calca (an open, file-based AI canvas) over MCP.
---

# Calca design exploration

Drive a calca canvas board over MCP to propose design variations, let the user
review them, and apply what they pick. All work is recorded on a board file the
user can open in the Calca app.

## Setup

- Run the server: `bunx @calca/mcp` or `calca mcp --file ./board.json` (stdio).
- Install into your host config: `calca mcp install <host>` — supported hosts:
  `claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`.

## Core loop

1. `canvas.read` — scope the board (summary first, then viewport/full as needed).
2. `canvas.propose` — record mutations as a proposal. This is the default
   mutation mode; do not use `canvas.apply` for first drafts.
3. User reviews proposals in the Calca app.
4. `canvas.apply` (optionally with `proposalId`) lands accepted changes.

Additional tools:

- `canvas.lease` — take exclusive soft leases (max 30 s TTL) on record ids when
  you iterate over multiple turns; renew or `canvas.release` when done.
- `canvas.comment` — leave structured notes on records (review feedback, rationale).
- `canvas.show_variations` — push 1-8 side-by-side HTML variations in one call.
  Preferred over manually creating frames: it creates a titled group with shared
  `groupId`, labels, and layout (`row` default, `column`, `grid`). Each variation
  needs `label` + `html`; sizes default to 480x320 px.
- `canvas.arrange` — re-lay out existing shapes as row/column/grid.

## Output formats

- Built-in format: `html-tailwind`. Generated HTML is rendered in a sandboxed
  frame; write self-contained markup with Tailwind utility classes.
- Custom stacks: drop `*.json` manifests in `.calca/formats/` (project) or
  `~/.calca/formats/` (user). Discovery walks from cwd toward home; the nearest
  match wins, home is the fallback. Override the search path with the
  `CALCA_FORMATS` env var (a single directory).
- Manifest shape (see [references/formats.md](references/formats.md) for the
  full reference):

```json
{
  "id": "html-daisyui",
  "extends": "html-tailwind",
  "frameEnv": {
    "styles": ["./daisyui.css"],
    "attrs": { "data-theme": "light" }
  },
  "promptSnippets": {
    "layout": "Use daisyUI component classes (btn, card, navbar) instead of raw Tailwind."
  }
}
```

- `extends` merges parent-first field-wise: child arrays replace parent arrays,
  child `attrs` keys override parent keys, unset child fields inherit.
- Inspect resolved formats with `canvas.formats` before generating.

## When NOT to use calca

- Single-page quick checks or throwaway prototypes — write the HTML file directly.
- Non-visual work (logic, config, docs) — use your normal workflow.

Calca earns its cost when the user needs to compare several directions
side-by-side and review visually over multiple iterations.
