# @app/landing

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

## 0.6.1

### Patch Changes

- Add PostHog analytics to landing page with pageview tracking

## 0.6.0

### Minor Changes

- feat: add onboarding tour and settings enhancements
  - Wire SettingsTourView and add ?tour query param for guided setup
  - Extend tutorial tour with settings configuration steps
  - Create SettingsTourView visual replica component
  - Add currentTourStepIdAtom for tour step tracking
  - Add data-tour attributes to settings UI elements
  - Extract SettingsContent from SettingsDialog

## 0.2.0

### Minor Changes

- ### Features
  - **Pro Package**: Initial scaffolding with Elastic License v2, module structure, and README
  - **Server App**: Initial scaffolding with AGENTS.md documentation
  - **Desktop Package**: Initial scaffolding for Electrobun wrapper
  - **Landing App**: Initial scaffolding for landing page
  - **CLI App**: Initial scaffolding for CLI tooling
