# @app/electrobun

## 0.8.0

### Patch Changes

- Updated dependencies
  - @app/server@0.8.0

## 0.7.5

### Patch Changes

- @app/server@0.7.5

## 0.7.4

### Patch Changes

- Updated dependencies
  - @app/server@0.7.4

## 0.7.3

### Patch Changes

- UX nits: import zooms to fit, bidirectional quickMode param, summary JSON repair, banner/toolbar overlap.
- Updated dependencies
  - @app/server@0.7.3

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @app/server@0.7.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @app/server@0.7.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @app/server@0.7.0

## 0.6.1

### Patch Changes

- Add PostHog analytics to landing page with pageview tracking
- Updated dependencies
  - @app/server@0.6.1

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
  - @app/server@0.6.0

## 0.4.1

### Patch Changes

- Fix Windows desktop build path corruption and update provider tests

  - Replace zx shell commands with Bun.spawn to prevent Windows backslash escaping issues
  - Add Windows binary extension search (.cmd, .exe, .ps1) for electrobun
  - Fix provider test expectations to match pass-through behavior
  - Exclude dist/ from test discovery in CI
  - @app/server@0.3.1
