# @app/core

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
