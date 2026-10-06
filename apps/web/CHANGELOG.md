# @app/web

## 0.7.2

### Patch Changes

- Desktop build: resolve @tailwindcss/browser from the workspace node_modules.
- Updated dependencies
  - @app/core@0.7.2
  - @app/shared@0.7.2
  - @app/analytics@0.7.2
  - @app/logger@0.7.2
  - @calca/canvas-base@0.7.2
  - @calca/canvas-flow@0.7.2

## 0.7.1

### Patch Changes

- Release CI fixes: node 22 for tsdown on release runners, ~/.npmrc auth for bun publish, checkout before gh release, clean calca-shared tarball.
- Updated dependencies
  - @app/core@0.7.1
  - @app/shared@0.7.1
  - @app/analytics@0.7.1
  - @app/logger@0.7.1
  - @calca/canvas-base@0.7.1
  - @calca/canvas-flow@0.7.1

## 0.7.0

### Minor Changes

- v-next architecture: three-layer open-source system. Layer 1 `@calca/canvas-*` canvas primitives (document model, headless UI, React Flow adapter) and Layer 2 `@calca/mcp-core`/`@calca/mcp` (`calca` CLI + MCP canvas tools) are delivered and published to npm for the first time. Web app deploys at `/app/`, end-user docs at `/docs/`, redesigned landing page, internal docs moved to `.agents/docs/`.

### Patch Changes

- Updated dependencies
  - @app/core@0.7.0
  - @app/shared@0.7.0
  - @app/analytics@0.7.0
  - @app/logger@0.7.0
  - @calca/canvas-base@0.7.0
  - @calca/canvas-flow@0.7.0

## 0.6.1

### Patch Changes

- Add PostHog analytics to landing page with pageview tracking
- Updated dependencies
  - @app/core@0.6.1
  - @app/shared@0.6.1
  - @app/analytics@0.6.1
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
  - @app/analytics@0.6.0
  - @app/logger@0.6.0

## 0.3.1

### Patch Changes

- Updated dependencies
  - @app/core@0.3.1

## 0.3.0

### Added

- **Vite Migration** — Complete migration from Next.js to Vite with TanStack Router for SPA routing
- **Theme System** — Swappable Tailwind v4 theme infrastructure with shadcn/ui utilities
- **Internationalization** — New `lib/i18n` module with English translations and `lib/export` with `.design` format support
- **IndexedDB Hook** — Custom IndexedDB hook for client-side data persistence
- **API Module** — Moved API fetch logic to separate module under `lib/`
- **Wheel Zoom Prevention** — Prevent wheel zoom on HUD components
- **Brand Voice** — Applied Calca brand voice across all UI copy

### Changed

- **Pipeline UI** — Slimmed `use-generation-pipeline` to UI-only; Mastra stream consumer handles server communication
- **Brand Rename** — Renamed Gosto→Calca in feature code and state

### Fixed

- Fixed index route availability with `createFileRoute`
- Fixed request body passing as `inputData`

### Tests

- Added rebrand verification tests

## 0.2.0

### Minor Changes

- ### Features

  - **Prompt Bar Redesign**: Complete rewrite with composition API, floating preset buttons, popover UIs for variations and critique mode, image integration with AI pipeline, and custom hooks for viewport/window events
  - **Design Summary UI**: Added summary list, dialog, and wired into canvas page
  - **Canvas Improvements**: Decomposed page.tsx into widgets, added rubber-band selection, resize handles with dimension overlay
  - **Settings Migration**: Migrated controls from settings modal to prompt bar, consolidated to settingsAtom, added env provider fallback
  - **TanStack Query Integration**: Migrated server-side fetch() calls to TanStack Query mutations with IndexedDB persistence for groups and images atoms
  - **Quick Mode**: Added stage skipping, URL param activation, and Tailwind preview rendering
  - **Toolbar**: Added provider-prefixed model name resolution in display

  ### Fixes

  - Fixed stale iframe height measurements and reduced visual jumps in design rendering
  - Fixed onboarding backdrop click handler to dismiss modal
  - Fixed config to load .env from repo root using dotenv

  ### Refactors

  - Extracted useClickOutside hook and cleaned up unused code
  - Deduplicated HTML parsing utilities into design/lib
  - Migrated page.tsx from useState/hooks to Jotai atoms
  - Moved public assets and src to apps/web directory
  - Extracted prompt history to reusable Jotai hook
