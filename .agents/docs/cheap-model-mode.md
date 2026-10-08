# Cheap-model mode — external vs internal UX blockers

> **Status: shipped** — implemented as the `fast` / `detailed` mode split
> with a `critique` toggle (this branch). `WorkflowInputSchema.mode` is now
> `"fast" | "detailed"` plus `critique: boolean`. Fast = semantic-token
> skeleton HTML (`buildFastPrompt`, ~6k max tokens, ≤2 variations, text-first
> summary). Detailed = the former Quick pipeline with a disciplined semantic
> palette. Critique is orthogonal: on either mode it switches frames to the
> sequential review+critique loop (the former "sequential" mode).
>
> Deferred per request: exploring non-React output targets for Detailed
> (Svelte/Alpine) and user-supplied component libs — the framework
> exploration is a research item, not built here.


Assessment of why free-tier models (the BYOK demo's most likely first-run
experience — e.g. OpenRouter `:free` variants) produce a broken-feeling
generation UX, and whether a low-complexity "easy/skeleton" generation mode is
worth building.

## TL;DR

- **External blockers are real and big**: ~20 rpm / 50–1000 req-per-day
  account-wide caps on `:free` models, higher and variable latency, no
  structured-output guarantee, and many free models emitting reasoning instead
  of usable text. We cannot fix these — but we can stop wasting them.
- **Internal blockers are also real**: a single generation is a multi-call
  pipeline whose layout step asks for up to 16k tokens of verbose Tailwind
  markup per frame, and schema-gated steps (`plan`, `summary`) depend on
  structured output that weak models often cannot produce.
- **Verdict**: a "Simple" output mode is feasible and bounded — a skeleton-HTML
  prompt variant + semantic design tokens, quick-mode pipeline (skip
  review/critique), `conceptCount` cap, and plain-text-first summary. Est.
  ~40–60% output-token reduction per frame and fewer chances for weak models to
  break markup.

## 1. External blockers (cannot fix — design around)

Facts about OpenRouter `:free` models (the disclosure case):

- **Account-wide rate limits**, not per model: ~20 requests/minute and
  50 requests/day (1,000/day once ≥$10 credits purchased). Pinning a specific
  `:free` model does not raise them.
  https://openrouter.helicone.ai/docs/guides/routing/model-variants/free,
  https://openrouter.ai/docs/api_reference/limits
- **Higher and variable latency**; availability fluctuates under load.
  https://openrouter.ai/docs/guides/routing/routers/free-router
- **No structured-output guarantee**: many free variants can't satisfy the AI
  SDK `Output.object` contract; several are reasoning models that spend their
  `max_tokens` budget on `<think>` blocks and return empty content.
- A full generation is **5–11 LLM calls** (see §2) — a handful of generations
  can exhaust a whole day's free quota, surfacing as mid-stream 429s that read
  as "everything broke".

## 2. Internal blockers (can fix)

Token budget per generation, from the pipeline source:

| Step | Calls | maxTokens | Output contract | Failure behavior today |
|------|-------|-----------|-----------------|------------------------|
| `plan` | 1 | 2,048 | `Output.object` | ✅ Tolerant — JSON parse → line-split → `VARIATION_STYLES` fallback |
| `layout` ×N frames | N | **16,384** | raw text → `validateLayout`/`parseHtmlWithSize` | ⚠️ Dominant cost; verbose Tailwind utility markup per frame |
| `images` | — | — | external image APIs | no LLM |
| `review` ×N (non-quick) | N | — | text | extra LLM calls |
| `critique` ×N (non-quick) | N | — | text | extra LLM calls |
| `summary` | 1 | 512 | `Output.object` | ⚠️ Falls back to raw-JSON parse, but observed `raw:""` on free models → silent no-summary |

So a default **quick** generation = plan + 3×layout + summary ≈ **5 calls**;
**sequential/critique** ≈ 1 + 3×(layout+review+critique) + 1 = **11 calls**.
Against a 50/day free cap that's 4–9 generations/day before hard 429s — and at
~10–25 tok/s on free variants, a 16k-token layout stream takes **4–10 minutes
per frame**, which is exactly the "everything hangs for minutes then breaks"
profile (compounded by any mid-stream teardown — see #86).

Two concrete internal fixes regardless of mode:

1. **Summary never needs `Output.object`.** The tolerant-parse path already
   exists; `raw:""` shows the object call itself starves weak models. Ask for
   `{title, rationale}` as a fenced JSON block in the prompt and parse — same
   result, works on models without structured output. (Same for `plan`'s first
   attempt.)
2. **Layout output is maximally verbose by design.** The prompt mandates
   per-node Tailwind utility strings — the most token-dense way to write CSS.
   Semantic class names + a shared token stylesheet amortize style tokens
   once per frame instead of once per element.

## 3. Proposed "Simple" mode

A third mode beside Quick/Critique (`mode` enum is `["quick","sequential"]` in
`packages/pipeline/src/types.ts`), or an orthogonal "output: full|simple"
toggle in the prompt bar:

- **Pipeline**: quick path (plan → layout → images → summary), `conceptCount`
  hard-capped at 1–2.
- **Layout prompt variant** (`buildSimplePrompt`): emit compact semantic HTML
  — e.g. `<section class="hero">`, `<div class="card">` — plus one `<style>`
  block with a small design-token system (`--bg`, `--fg`, `--accent`,
  `--card`, `--radius`, spacing scale) and ~10 reusable classes. Roughly halves
  output tokens vs utility-per-node markup and shrinks the model's search
  space (fewer decisions, fewer malformed-utility edge cases). Bonus: the
  token stylesheet can be inlined statically, removing the per-frame
  `cdn.tailwindcss.com` dependency/warning in srcdoc frames.
- **Summary**: plain-text-first as above; skip entirely when model id ends in
  `:free` (heuristic) if the parse still fails.
- **maxTokens**: layout can drop to ~4–6k — both a budget signal to the model
  and a wall-clock cap.
- **Auto-suggestion**: when the saved model id ends in `:free` (or probe shows
  a free-model listing), suggest Simple mode in the prompt bar rather than
  silently defaulting — keeps user agency, avoids a hidden quality cliff.

### Precedents

- Lovable splits **Plan Mode / Build Mode** — separating reasoning from code
  emission is the same idea: cheap/weak models do best when each call has one
  narrow job. https://stackmatchup.com/lovable-vs-bolt-new-vs-v0/
- Bolt's token metering treats project context as the dominant cost lever —
  mirrors our layout verbosity being the dominant output cost.
  https://vibecodingintel.com/guides/lovable-vs-bolt-vs-v0/
- Related prior art in-repo: `.agents/docs/progressive-generation.md` — Simple
  mode's smaller frames also make progressive streaming more tractable
  (smaller documents parse and mount sooner), and its #70 measurement fix
  applies identically.

## 4. Scope estimate

- `packages/core/src/prompts/layout.ts`: add `buildSimplePrompt` (~80 lines)
- `packages/pipeline/src/types.ts`: extend mode or add `outputMode`
- `packages/pipeline/src/steps/summary.step.ts`: prompt-JSON-first path
- `apps/web/src/widgets/prompt-bar`: third mode chip + `:free` suggestion
- `apps/web` messages: ~4 new i18n keys
- Tests: prompt-builder snapshot + summary parse (existing patterns)

Bounded — no new dependencies, no API-shape changes.
