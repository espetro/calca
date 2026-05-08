# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.1] - 2026-05-08

### Added

- **Landing Analytics** — Added PostHog analytics to the landing page with pageview tracking; initialized via React component with cookieless mode
- **CI Landing Secrets** — Injected PostHog env vars into landing page build step for CI deployment

## [0.6.0] - 2026-05-07

### Added

- **Onboarding Tour** — Wire SettingsTourView and add ?tour query param for guided setup
- **Settings Tour Steps** — Extend tutorial tour with settings configuration steps
- **Settings UI Components** — Add data-tour attributes to settings UI elements for tour integration

### Changed

- **SettingsDialog** — Extract SettingsContent from SettingsDialog for better component composition
- **Tour Tracking** — Add currentTourStepIdAtom for centralized tour step state management

## [0.5.0] - 2026-05-06

### Added

- **Onboarding** — Restored welcome-modal with original flow; replaced SettingsModal/WelcomeModal with SettingsDialog; migrated onboarding-banner to shadcn design system
- **Feedback** — Updated feedback UI to show discussion comment URL; switched feedback-proxy from GitHub Issues to Discussion comments
- **Desktop Context Menus** — Implemented frame clipboard, context menu, and keyboard shortcuts; added Duplicate, disabled states, and shortcut labels; added Delete menu item and accelerator shortcuts
- **NavigationMenu** — New shared NavigationMenu UI component replacing dropdown-menu patterns in context toolbar, remix button, and export menu
- **Custom Remix** — Added custom remix flow via prompt bar
- **Landing Page** — Built landing page with Astro, React, and Tailwind v4; added static assets, sections, and GitHub Pages deployment
- **Analytics** — Enabled PostHog initialization on app startup
- **Code Signing** — Added Apple code signing and notarization steps to desktop CI workflow; enabled signing in Electrobun config
- **Feedback Proxy CF Workers** — Added Cloudflare Workers deployment workflow; wired CF Workers entry point; extracted modules and scaffolding

### Changed

- **shadcn Migration** — Migrated remaining raw HTML primitives, buttons, popovers, and dropdowns to shadcn components across the web app
- **Desktop Build** — Simplified build scripts with shared logger and extracted helpers; added build script with env loading and artifact prep
- **Mode Sidebar** — Improved mode sidebar and system prompt button layout
- **Desktop Context Menu** — Suppressed default WebKit context menu; fixed platform detection and wired web-to-native RPC

### Fixed

- Fixed desktop `Updater.getLocalInfo` usage per electrobun lint
- Made feedback email required with disposable email validation
- Added react types back to web app
- Extracted action button to separate module
- Pinned `@tailwindcss/browser` to 4.2.4 for CI reliability
- Resolved workflow failures for feedback-proxy, desktop build, and landing page
- Only notarize in CI to avoid local build failures
- Cleaned up imports in feedback-modal
- Prevented text overflow in critique mode button
- Improved React type safety in error-boundary with PropsWithChildren pattern
- Used direct file imports for lazy route components
- Used default exports for lazy comment loading
- Migrated remaining raw buttons to shadcn Button, fixed textarea border
- Updated design card for desktop layouts
- Added Tailwind CSS browser build support for desktop

### Tests

- Added unit tests for frame clipboard copy/paste

### Docs

- Consolidated architecture decisions into clean ADRs and PRD
- Cleaned up e2e testing best practices heading
- Fixed markdown formatting in PRD v2
- Removed roadmap directory
- Renumbered MADR files and added pro-package-architecture decision
- Updated project READMEs to match current state

### Chore

- Updated gitignore
- Installed shadcn popover, progress, and textarea components
- Updated lockfile after shadcn component installs
- Added react-icons and mailchecker dependencies
- Extracted action button to separate module
- Updated desktop bun.lock

## [0.4.1] - 2026-05-03

### Fixed

- Replaced `zx` with Bun.spawn to fix Windows path corruption
- Searched for Windows binary extensions (`.cmd`, `.exe`, `.ps1`)
- Used POSIX paths in zx and `fs/promises` for file ops
- Resolved electrobun binary and Windows path issues
- Updated provider tests to match pass-through behavior
- Used vitest via `bun run test` and excluded dist tests from CI

### Changed

- Replaced `zx` with Bun shell for build scripts

### Chore

- Bumped desktop version to 0.4.0

## [0.4.0] - 2026-05-01

### Added

- **Desktop App** — Scaffolded Electrobun project with config, main process stub, build scripts, and native context menu; added application menu with Help > Report Bug
- **Auto-Updater** — Implemented auto-updater flow using Electrobun Updater API
- **Analytics** — Added PostHog client, events, types, and tests; instrumented web app with PostHog event tracking; added analytics opt-out toggle to General settings
- **Feedback** — Added feedback UI with bug icon, modal, and form; scaffolded feedback proxy with GitHub Issues creation via Octokit
- **Settings** — Added shadcn/ui components, Zod schemas, and new UI shells for settings and onboarding; added Reset to Factory Settings utility; added language section and improved provider card layout; added analyticsEnabled field; added required model and optional fallbackModel to settings types
- **Desktop CI/CD** — Added GitHub Actions CI/CD pipeline for desktop builds; added desktop tasks to Turborepo pipeline
- **Toolbar** — Added compass to zoom bar; redistributed toolbar into three FSD features
- **Error Boundary** — Added reusable ErrorBoundary component
- **AI SDK Telemetry** — Added AI SDK telemetry adapter and pipeline step transition logging

### Changed

- **Toolbar Rewrite** — Rewrote mode-sidebar with tooltips, lucide icons, and compact sizing; rewrote export-menu and remix-button to use dropdown-menu with hover behavior; unified canvas-hud styling
- **Desktop Scripts** — Replaced shell scripts with cross-platform TypeScript; consolidated scripts into single build command and cross-platform dev coordinator; broke down monolithic entry point into focused modules
- **Server** — Exported Hono app without starting server for embeddability; migrated console.* to @app/logger; removed custom logging wrapper
- **Frontend** — Replaced fetch with Hono RPC client; added shared dropdown-menu and tooltip components; replaced custom SVGs with lucide icons
- **Monorepo** — Simplified workspace imports to use package.json exports/imports; consolidated desktop to `platforms/desktop/` and removed stale scaffolds

### Fixed

- Probed user's configured models instead of hardcoded list; replaced MODEL_FALLBACK_CHAIN with buildModelFallbackChain; removed DEFAULT_MODEL from settings and pipeline
- Required model configuration in onboarding flow; removed Claude-only preset models from model picker
- Prevented welcome re-showing on reload and fixed tour re-render
- Migrated SettingsDialog to jotai atoms for state consistency
- Resolved CORS error by adding dev server proxy
- Bridged VITE_AI_* env vars from root .env to import.meta.env
- Fixed hardcoded colors and suppressed CDN warning; added semantic tokens and updated component colors; improved color visibility and mode differentiation
- Used custom jotai provider to sync desktop app bar functionality
- Removed idle timeout limit on electrobun
- Fixed HMR for server, dev scripts, and API proxy loop
- Improved server binding, dev detection, and added verification tooling
- Ensured loggers are initialized in all apps
- Implemented working cache with LRU eviction and fallback backoff
- Resolved hydration race causing onboarding to re-show on reload
- Resolved all TypeScript errors in @app/web
- Standardized lint/format/typecheck scripts across all workspaces

### Performance

- Lazy-loaded non-critical features and deferred devtools
- Added Vite code splitting with manualChunks
- Switched to `views://` protocol and added splash screen in desktop

### Docs

- Added auto-update, distribution, and storage migration plans for desktop
- Added AGENTS.md for desktop

### Chore

- Removed last mentions to 'gosto' in place of 'calca'
- Updated oxfmt config to sort imports
- Applied oxfmt and oxlint auto-fixes across codebase
- Disabled stylistic oxlint rules and fixed override syntax
- Ran formatter across the whole project
- Ensured oxlint and oxfmt are always executed with 'validate' script
- Updated bun.lock

## [0.1.0] - 2025-04-05

### Added

- Project reset with monorepo structure
- Turbo workspace configuration
- Changesets for version management
- Conventional commit enforcement with commitlint
- Initial package structure with apps (web, server, landing, cli) and packages (desktop, shared)
