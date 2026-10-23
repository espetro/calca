# @calca/mcp-core

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
  - @calca/canvas-base@0.9.0

## 0.8.0

### Patch Changes

- @calca/canvas-base@0.8.0

## 0.7.5

### Patch Changes

- Add `repository.url` + `directory` to package manifests — required for provenance validation under npm trusted publishing.
- Updated dependencies
  - @calca/canvas-base@0.7.5

## 0.7.4

### Patch Changes

- @calca/canvas-base@0.7.4

## 0.7.3

### Patch Changes

- UX nits: import zooms to fit, bidirectional quickMode param, summary JSON repair, banner/toolbar overlap.
- Updated dependencies
  - @calca/canvas-base@0.7.3

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @calca/canvas-base@0.7.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @calca/canvas-base@0.7.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @calca/canvas-base@0.7.0
