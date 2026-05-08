# @app/server

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
