# @calca/canvas-ui

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @calca/shared@0.7.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @calca/shared@0.7.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @calca/shared@0.7.0
