# @app/web

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
