# 0002 — Use Anthropic (Claude) as Primary AI Provider

## Context and Problem Statement

Otto Canvas needs an AI model capable of generating production-quality HTML/CSS designs from natural language descriptions. The model must handle complex prompts with design rules, output self-contained HTML with inline styles, and support vision capabilities for design review/QA. Additionally, the application needs a model for generating design critique and improvement feedback.

The core layout generation pipeline requires a model that can:
- Follow strict output format rules (size hints, no markdown fences, no animations)
- Generate visually sophisticated HTML/CSS with proper typography, spacing, and color theory
- Handle revision requests (edit existing HTML while preserving structure)
- Accept multimodal input (reference images) for context-aware generation

## Decision Drivers

* **HTML/CSS output quality** — Model must produce production-quality, self-contained designs
* **Instruction following** — Model must strictly adhere to complex prompt rules
* **Vision capabilities** — Model needs to "see" generated designs for QA review
* **Multimodal input** — Support reference images as context
* **Cost** — BYOK model means users pay per token; higher quality at lower cost is preferred
* **Streaming** — Long generation times need streaming to avoid timeout

## Considered Options

* **Anthropic Claude (Opus/Sonnet)** — High-quality instruction following, strong code generation, multimodal input
* **OpenAI GPT-4o** — Strong code generation, vision capabilities, widely available
* **Google Gemini** — Good multimodal support, competitive pricing
* **Multi-provider with fallbacks** — Support multiple models with automatic fallback

## Decision Outcome

Chosen option: **"Anthropic Claude as primary provider, with Gemini for image generation only"**

The application uses Claude exclusively for all text/code generation tasks:
- **Layout generation** (`/api/pipeline/layout`) — Claude Opus 4.6 / Sonnet 4.5
- **Visual QA review** (`/api/pipeline/review`) — Claude
- **Design critique** (`/api/pipeline/critique`) — Claude
- **Concept planning** (`api/plan`) — Claude
- **Code export** (`/api/export`) — Claude (Tailwind/React conversion)

Google Gemini is used only for image generation (`/api/pipeline/images`). Unsplash and DALL-E are supported as additional image sources.

### Consequences

* Good: Claude excels at following complex prompt instructions (size hints, no-motion rules, single-design output)
* Good: Single provider simplifies the codebase — one SDK, one auth pattern, consistent behavior
* Good: Model fallback chain (Opus 4.6 → Sonnet 4.5 → Opus 4 → Sonnet 4) provides graceful degradation
* Good: BYOK model means zero marginal cost for the developer — users bring their own Anthropic API keys
* Bad: Single point of failure — Anthropic outages or API changes break the entire generation pipeline
* Bad: Users must have an Anthropic API key to use the app at all — creates friction for new users
* Bad: Cannot leverage potentially cheaper or faster alternatives for simpler tasks (e.g., concept planning could use GPT-4o-mini)
* Bad: Claude's output quality varies significantly between model tiers — Sonnet produces noticeably worse designs than Opus, creating inconsistent user experience
