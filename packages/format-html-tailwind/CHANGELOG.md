# @calca/format-html-tailwind

## 0.9.0

### Minor Changes

- 72f4177: v0.9.0 release: pluggable format system and format-aware canvas tools.

  - New `@calca/format` seam defining the format contract for rendering canvas designs to different output targets.
  - New `@calca/format-html-tailwind` package implementing the html-tailwind format on Tailwind v4.
  - Format manifest discovery from `.calca/formats` in the project directory and the user home directory.
  - `calca` CLI gains a `--formats` flag for selecting available formats.
  - New MCP tools `canvas.formats` (list discovered formats) and `canvas.show_variations` (render a design with a chosen format).
  - Agent skill packaging so formats ship with usage instructions an agent can read.
  - Fixed MCP SSE transport keep-alive so long-running tool calls no longer drop idle connections.

### Patch Changes

- Updated dependencies [72f4177]
  - @calca/format@0.9.0
