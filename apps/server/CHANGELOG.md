# @app/server

## 0.7.5

### Patch Changes

- @app/shared@0.7.5
- @calca/pipeline@1.0.5
- @app/core@0.7.5
- @app/logger@0.7.5

## 0.7.4

### Patch Changes

- The API layer now runs inside a root-scoped service worker on static deployments, so the hosted web demo answers `/api/*` end to end (probe, generation streams, exports). Error handling fixes: workflow stream no longer swallows non-OK responses as "Workflow complete", probe failures report the real status, and export errors surface the actual cause.
  - @app/core@0.7.4
  - @app/shared@0.7.4
  - @app/logger@0.7.4
  - @calca/pipeline@1.0.4

## 0.7.3

### Patch Changes

- UX nits: import zooms to fit, bidirectional quickMode param, summary JSON repair, banner/toolbar overlap.
- Updated dependencies
  - @app/core@0.7.3
  - @app/shared@0.7.3
  - @app/logger@0.7.3
  - @calca/pipeline@1.0.3

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @app/core@0.7.2
  - @app/shared@0.7.2
  - @app/logger@0.7.2
  - @calca/pipeline@1.0.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @app/core@0.7.1
  - @app/shared@0.7.1
  - @app/logger@0.7.1
  - @calca/pipeline@1.0.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @app/core@0.7.0
  - @app/shared@0.7.0
  - @app/logger@0.7.0
  - @calca/pipeline@1.0.0

## 0.6.1

### Patch Changes

- Add PostHog analytics to landing page with pageview tracking
- Updated dependencies
  - @app/core@0.6.1
  - @app/shared@0.6.1
  - @app/logger@0.6.1

## 0.6.0

### Minor Changes

- feat: add onboarding tour and settings enhancements
  - Wire SettingsTourView and add ?tour query param for guided setup
  - Extend tutorial tour with settings configuration steps
  - Create SettingsTourView visual replica component
  - Add currentTourStepIdAtom for tour step tracking
  - Add data-tour attributes to settings UI elements
  - Extract SettingsContent from SettingsDialog

### Patch Changes

- Updated dependencies
  - @app/core@0.6.0
  - @app/shared@0.6.0
  - @app/logger@0.6.0

## 0.3.1

### Patch Changes

- Updated dependencies
  - @app/core@0.3.1

## 0.2.0

### Minor Changes

- ### Features
  - **Pro Package**: Initial scaffolding with Elastic License v2, module structure, and README
  - **Server App**: Initial scaffolding with AGENTS.md documentation
  - **Desktop Package**: Initial scaffolding for Electrobun wrapper
  - **Landing App**: Initial scaffolding for landing page
  - **CLI App**: Initial scaffolding for CLI tooling
