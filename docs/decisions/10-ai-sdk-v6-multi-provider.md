# 0010 — AI SDK v6 Multi-Provider Architecture

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-12
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

Previously, the application followed [ADR 0002 — Use Anthropic (Claude) as Primary AI Provider](./0002-original-anthropic-only.md): Claude handled all text and code generation tasks (layout, review, critique, planning, export), while Google Gemini was used for image generation via a separate SDK. This approach created tight coupling to Anthropic's SDK, made provider switching difficult, and required users to have an Anthropic API key to use the app at all.

As the project evolved, we needed a more flexible architecture that could support multiple AI providers through a unified interface, enable local development with open-source models, and reduce vendor lock-in.

## Decision Drivers

* **Multi-provider support** — Must support Anthropic, OpenAI-compatible providers, and local models without rewriting provider-specific code
* **Unified API** — Single interface for text generation, streaming, and structured outputs across all providers
* **Easier provider switching** — Users should be able to change providers and models via settings without code changes
* **LM Studio compatibility** — Local development should work with OpenAI-compatible endpoints (e.g., LM Studio on `http://localhost:1234/v1`)
* **Reduced maintenance** — Avoid maintaining custom abstraction layers or multiple provider SDKs

## Considered Options

* **Keep direct SDKs** — Continue using `@anthropic-ai/sdk` and `@google/generative-ai` directly. Pros: full feature access. Cons: duplicated logic, tight coupling, no local model support.
* **Adopt AI SDK v6 unified interface** — Use Vercel's `ai` SDK with provider packages (`@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`). Pros: standardized API, streaming, fallbacks, and local model support out of the box. Cons: dependency on AI SDK release cycle, occasional provider-specific limitations.
* **Build a custom abstraction layer** — Write an internal provider wrapper that normalizes requests across SDKs. Pros: full control. Cons: significant ongoing maintenance, reinvents what AI SDK already solves.

## Decision Outcome

Chosen option: **"Adopt AI SDK v6 as unified interface for all AI providers"**

The `packages/core` module now uses AI SDK v6 for all LLM interactions:

- **Text generation** (`generateText`) and **streaming** (`streamText`) are handled through `ai` with provider-specific model wrappers
- **Anthropic** is supported via `@ai-sdk/anthropic`
- **OpenAI-compatible providers** (including LM Studio) are supported via `@ai-sdk/openai-compatible`
- **Google Gemini** remains used for image generation via `@ai-sdk/google`
- **Model fallback chain** is implemented in `packages/core/src/ai/client.ts`, automatically falling back through `claude-opus-4-6 → claude-sonnet-4-5 → claude-opus-4 → claude-sonnet-4`

This supersedes [ADR 0002 — Use Anthropic (Claude) as Primary AI Provider](./0002-original-anthropic-only.md).

### Consequences

* Good: Provider-agnostic code — switching from Anthropic to an OpenAI-compatible provider requires only a config change
* Good: Local development with LM Studio works out of the box using `createOpenAICompatible`
* Good: Unified streaming and generation APIs reduce code duplication across pipeline stages
* Good: Built-in structured output support simplifies future feature additions
* Bad: Dependency on AI SDK maintenance and release cadence
* Bad: Some provider-specific features may be abstracted away or lag behind native SDK support
* Neutral: Existing pipeline stages (plan, layout, images, review, critique) remain conceptually the same; only the provider layer changed

## Validation

- `packages/core/src/ai/providers.ts` implements `getAIProvider()` returning standardized `LanguageModelV3` instances for both Anthropic and OpenAI-compatible providers
- `packages/core/src/ai/client.ts` uses `generateText` and `streamText` from `ai` with automatic model fallback
- Local development defaults in `apps/web` point to `http://localhost:1234/v1` (LM Studio) and probe `/models` successfully
- All pipeline stages (plan, layout, review, critique) execute correctly through the unified interface

## More Information

- Supersedes: [ADR 0002 — Use Anthropic (Claude) as Primary AI Provider](./0002-original-anthropic-only.md)
- Related files:
  - `packages/core/src/ai/providers.ts`
  - `packages/core/src/ai/client.ts`
  - `packages/core/src/ai/index.ts`
