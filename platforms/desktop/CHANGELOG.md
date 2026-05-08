# @app/electrobun

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
