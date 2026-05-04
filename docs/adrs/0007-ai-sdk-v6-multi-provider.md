# AI SDK v6 Multi-Provider Architecture

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-12
- **Decision makers**: Joaquin Terrasa

## Context and Problem Statement

The previous implementation coupled AI calls directly to individual SDKs: `@anthropic-ai/sdk` for text and code generation across all pipeline stages, and `@google/generative-ai` for image generation. This tight coupling made provider switching difficult and required an Anthropic API key to use the app at all.

The application needs a flexible architecture that can:

- Support multiple AI providers through a single unified interface
- Enable local development with open-source models (e.g. LM Studio)
- Reduce vendor lock-in while preserving access to provider-specific features
- Maintain prompt engineering as the core IP without framework overhead

## Decision Drivers

- **Multi-provider support** — Must support Anthropic, OpenAI-compatible providers, and local models without rewriting provider-specific code
- **Unified API** — Single interface for text generation, streaming, and structured outputs across all providers
- **Easier provider switching** — Users should be able to change providers and models via settings without code changes
- **LM Studio compatibility** — Local development should work with OpenAI-compatible endpoints (e.g. `http://localhost:1234/v1`)
- **Reduced maintenance** — Avoid maintaining custom abstraction layers or multiple provider SDKs

## Considered Options

- **Keep direct SDKs** — Continue using `@anthropic-ai/sdk` and `@google/generative-ai` directly. Pros: full feature access. Cons: tight coupling, no local model support, duplicated logic across pipeline stages.
- **Adopt AI SDK v6 unified interface** — Use Vercel's `ai` SDK with provider packages (`@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`). Pros: standardized API, streaming, fallbacks, and local model support out of the box. Cons: dependency on AI SDK release cycle.
- **Build a custom abstraction layer** — Write an internal provider wrapper that normalizes requests across SDKs. Pros: full control. Cons: significant ongoing maintenance, reinvents what AI SDK already solves.
- **Adopt an orchestration framework (Mastra)** — Use a framework to orchestrate AI calls and pipeline stages. Pros: built-in retries, observability. Cons: over-abstraction for a sequential 4-step pipeline; does not help with prompt engineering, which is the core IP; model-specific features (Claude streaming, vision, system prompts) require custom adapters anyway. See "Why Not Mastra" below.

## Decision Outcome

Chosen option: **"Adopt AI SDK v6 as unified interface for all AI providers"**

The `packages/core` module now uses AI SDK v6 for all LLM interactions:

- **`generateText`** and **`streamText`** are handled through `ai` with provider-specific model wrappers
- **Anthropic** is supported via `@ai-sdk/anthropic`
- **OpenAI-compatible providers** (including LM Studio) are supported via `@ai-sdk/openai-compatible`
- **Google Gemini** is used for image generation via `@ai-sdk/google`
- **Model fallback chain** is implemented in `packages/core/src/ai/client.ts`, automatically falling back through a configurable chain (e.g. `preferredModel → fallbackModel`)

### Why Not Mastra

An orchestration framework like Mastra was evaluated but rejected. The reasoning:

1. **Over-abstraction** — The pipeline is 4–5 sequential steps with clear data flow. A DAG framework adds complexity without proportional value.
2. **Model-specific features are used directly** — Claude's streaming, vision (image blocks), and system prompts are required. Mastra would need custom adapters for each.
3. **Image pipeline is multi-vendor** — Unsplash API, DALL-E, and Gemini image generation are not LLM calls. Mastra does not abstract these.
4. **Prompt engineering is the IP** — System prompts and generation prompts are the core value. A framework does not help with prompt engineering.
5. **Dependency risk** — Mastra is newer and less battle-tested than direct SDK calls through AI SDK v6.

### Consequences

- Good: Provider-agnostic code — switching from Anthropic to an OpenAI-compatible provider requires only a config change
- Good: Local development with LM Studio works out of the box using `createOpenAICompatible`
- Good: Unified streaming and generation APIs reduce code duplication across pipeline stages
- Good: Built-in structured output support simplifies future feature additions
- Bad: Dependency on AI SDK maintenance and release cadence
- Bad: Some provider-specific features may be abstracted away or lag behind native SDK support
- Neutral: Existing pipeline stages (plan, layout, images, review, critique) remain conceptually the same; only the provider layer changed

## Validation

The decision is validated by the following implementation:

- `packages/core/src/ai/providers.ts` implements `getAIProvider()` returning standardized `LanguageModelV3` instances for both `anthropic` and `openai-compatible` providers, with `buildModelFallbackChain()` for automatic fallback
- `packages/core/src/ai/client.ts` uses `generateText` and `streamText` from `ai` with automatic model fallback via `generateWithFallback()` and `streamAnthropic()`
- `@ai-sdk/anthropic` handles Anthropic models, `@ai-sdk/openai-compatible` handles LM Studio and other OpenAI-compatible endpoints, `@ai-sdk/google` handles image generation
- Local development defaults in `apps/web` point to `http://localhost:1234/v1` (LM Studio) and probe `/models` successfully
- All pipeline stages (plan, layout, review, critique) execute correctly through the unified interface

## More Information

- Provider implementation: `packages/core/src/ai/providers.ts`
- Client with fallback: `packages/core/src/ai/client.ts`
- Image provider: `packages/core/src/ai/providers.ts` (`getGeminiImageModel`)
