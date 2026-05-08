# @app/shared

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

  - **Zod Schemas**: Added shared schemas for layout, review, critique, and summary validation
  - **Type Consolidation**: Consolidated Settings type across the monorepo

  ### Tests

  - Added layout schema unit tests

  ### Docs

  - Added package-specific AGENTS.md documentation
