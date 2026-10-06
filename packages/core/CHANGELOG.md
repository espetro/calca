# @app/core

## 0.7.4

### Patch Changes

- @app/logger@0.7.4

## 0.7.3

### Patch Changes

- UX nits: import zooms to fit, bidirectional quickMode param, summary JSON repair, banner/toolbar overlap.
- Updated dependencies
  - @app/logger@0.7.3

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @app/logger@0.7.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @app/logger@0.7.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @app/logger@0.7.0

## 0.6.1

### Patch Changes

- Add PostHog analytics to landing page with pageview tracking
- Updated dependencies
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
  - @app/logger@0.6.0

## 0.3.1

### Patch Changes

- Fix Windows desktop build path corruption and update provider tests
  - Replace zx shell commands with Bun.spawn to prevent Windows backslash escaping issues
  - Add Windows binary extension search (.cmd, .exe, .ps1) for electrobun
  - Fix provider test expectations to match pass-through behavior
  - Exclude dist/ from test discovery in CI

## 0.3.0

### Added

- **Mastra Integration** — Added Mastra + type-fest dependencies, created schemas, and MADR 0012
- **Workflow Steps** — Mastra workflow steps for the AI design pipeline
- **Pipeline Assembly** — Assembled design pipeline workflow with API route and step tests
- **Stream Consumer** — Mastra stream consumer hook for real-time pipeline output

### Changed

- **Pipeline Refactor** — Slimmed `use-generation-pipeline` to UI-only; Mastra stream consumer handles server communication

### Fixed

- Removed old API routes and wired remix/revision through the Mastra workflow
- Resolved AI SDK provider-utils version mismatch
- Added missing workspace dependencies and package exports for Mastra pipeline

### Tests

- Added integration tests for Mastra design pipeline workflow

### Docs

- Updated pipeline route example to workflow pattern

## 0.2.0

### Minor Changes

- ### Features

  - **AI Pipeline**: Added generate, stream, probe, and fallback utilities for AI providers
  - **Multi-Provider Support**: Added provider abstraction with support for Anthropic, Google, and OpenAI-compatible providers
  - **Pipeline Stages**: Implemented layout, images, review, critique, plan, and summary stages
  - **Prompts**: Added dedicated prompt modules for each pipeline stage (layout, review, critique, plan, summary)
  - **Zod Validation**: Integrated Zod validation with graceful fallback in layout, review, and critique stages

  ### Fixes

  - Fixed provider type to 'openai-compatible' when base URL is set

  ### Tests

  - Added unit tests for parsers, providers, and settings lib
