# Quick start

## 1. Open the app

- **Web:** open [calca.illo.fyi/app](https://calca.illo.fyi/app/) — no install.
- **Desktop:** grab the latest build from
  [GitHub Releases](https://github.com/espetro/calca/releases) (macOS or Windows).

## 2. Connect a provider

Calca is BYOK — it has no built-in AI account. Open **Settings** (top right),
add a provider, and pick a model. Keys live in your browser's local storage and
requests go straight from your machine to the provider.

The fastest free route: create an [OpenRouter](https://openrouter.ai) key, add
an **OpenAI-Compatible** provider with base URL `https://openrouter.ai/api/v1`,
and choose a cheap model like `google/gemini-2.5-flash`. Full details in
[Providers & BYOK](/providers).

## 3. Generate your first frames

Type what you want in the prompt bar — be concrete about layout and content:

> A landing page for a sourdough bakery — warm hero with a tagline, a three-item
> bread menu with prices, a short story section, and a footer with hours and
> address.

Calca generates several variations as separate frames on the canvas. Drag them,
zoom, pick a favorite, and **Remix** any frame to iterate on it.

## 4. Deep links

Share a starting point with `?prompt=` and `?preset=`:

```
https://calca.illo.fyi/app/?prompt=A+pricing+page&preset=marketing
```

`prompt` pre-fills the prompt bar; `preset` selects a
[format preset](/presets) (`uiux`, `marketing`, `brand`, `presentation`,
`email`, `custom`).
