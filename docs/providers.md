# Providers & BYOK

Calca talks to AI providers directly from the app — there is no Calca account
and no Calca-side proxy holding your key. Your key is stored in local storage
and every request goes from your browser (or the desktop app) to the provider
endpoint you configured.

## Supported provider types

| Type | Use it for | Fields |
| --- | --- | --- |
| **OpenAI-Compatible** | OpenRouter, OpenAI, Groq, Together, LM Studio, vLLM, any `/v1/chat/completions` endpoint | API key, base URL, model id |
| **Anthropic** | Claude models | API key, model id |

## Recommended setups

**OpenRouter (easiest, one key for many models)**

- Base URL: `https://openrouter.ai/api/v1`
- Model: `google/gemini-2.5-flash` is a good cost/quality floor; heavier models
  follow your budget.

**Anthropic**

- Model: `claude-sonnet-4-5` or your preferred Claude.

**Local (free, offline)**

- Run [LM Studio](https://lmstudio.ai), load any model, start the local server.
- Base URL: `http://localhost:1234/v1`, API key: leave empty.
- Great for iterating without spending tokens; expect weaker layouts from
  small local models.

## Two-provider setup

Settings lets you keep a **primary** provider and configure additional
providers to switch between. If generation fails or a model is rate-limited,
swap the active provider/model from the toolbar — the cheapest fallback that
still holds multi-component layouts is `google/gemini-2.5-flash` on OpenRouter.

::: callout tip
Rough cost guide: generating a batch of design variations on
`gemini-2.5-flash` costs well under a cent. Sessions of everyday experimentation
stay under a dollar unless you deliberately pick frontier models.
:::
