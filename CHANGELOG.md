# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-04-26

### Added

- **Mastra AI Pipeline** — Full workflow-based design pipeline with Mastra, including workflow steps, stream consumer hook, and integration tests
- **Hono Server** — New standalone Hono server with CORS, route handlers, and API routes for the design pipeline
- **Vite Migration** — Web app migrated from Next.js to Vite with TanStack Router for SPA routing
- **Theme System** — Swappable Tailwind v4 theme infrastructure with shadcn/ui utilities
- **Internationalization** — New `lib/i18n` module with English translations and `lib/export` with `.design` format support
- **IndexedDB Hook** — Custom IndexedDB hook for client-side data persistence
- **Brand Rebrand** — Complete rebrand from Gosto to Calca with new logo assets, brand voice ADR, and updated UI copy

### Changed

- **Pipeline Architecture** — Slimmed `use-generation-pipeline` to UI-only; Mastra stream consumer handles server communication
- **Brand Rename** — Renamed Gosto→Calca across all infrastructure files and feature code

### Fixed

- Removed old API routes and wired remix/revision through the Mastra workflow
- Resolved AI SDK provider-utils version mismatch
- Added missing workspace dependencies and package exports for the Mastra pipeline
- Fixed request body passing as `inputData`
- Fixed index route availability with `createFileRoute`

### Tests

- Added integration tests for Mastra design pipeline workflow
- Added rebrand verification tests

### Docs

- Updated pipeline route example to workflow pattern

### Chore

- Simplified `dev-web` script on root package.json
- Added Mastra + type-fest dependencies and created schemas + MADR 0012
- Updated lockfile for Calca rebrand dependencies
- Updated public icons and pro package readme
- Removed old `otto-icon.jpg` branding assets

## [0.1.0] - 2025-04-05

### Added

- Project reset with monorepo structure
- Turbo workspace configuration
- Changesets for version management
- Conventional commit enforcement with commitlint
- Initial package structure with apps (web, server, landing, cli) and packages (desktop, shared)
