# @app/core

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
