# @calca/shared

## 0.8.0

### Minor Changes

- Generation modes: `fast` / `detailed` + orthogonal `critique` toggle (replaces quick/sequential). Fast emits compact semantic-token skeleton HTML optimized for free/weak models; critique runs the sequential review loop on either mode. Also: self-healing frame heights, summary fallbacks for models without structured output, "Summary unavailable" status, and output guards for free-model prose leaks.

## 0.7.5

### Patch Changes

- Add `repository.url` + `directory` to package manifests — required for provenance validation under npm trusted publishing.

## 0.7.4

## 0.7.3

### Patch Changes

- UX nits: import zooms to fit, bidirectional quickMode param, summary JSON repair, banner/toolbar overlap.

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.
