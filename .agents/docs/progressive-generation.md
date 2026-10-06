# Progressive Generation — Feasibility Assessment

> **Status: design note, not a plan.** Assessment for [#79](https://github.com/espetro/calca/issues/79) part 2 — speculative execution with real-time progressive streaming and optimistic sandboxing. Companion to the per-stage progress UI shipped in the same PR.

## The idea

Today a frame renders only when it finishes: the iframe `srcDoc` is set once, atomically, at `frameComplete`. *Progressive generation* would render the layout step's partial output into a sandboxed preview as it streams — the user watches the design materialize instead of staring at a spinner — then atomically swaps in the authoritative result when the step (or its successors) complete.

## How the pipeline works today

```
designPipeline (packages/pipeline/src/pipeline.ts)
  plan → [per frame: layout → images → (review → critique)*] → summary → collectResults
                 * sequential mode only

PipelineEvent ──emit──▶ designPipelineStream (stream.ts)
  step/frame/done events ──▶ data-workflow SSE parts (`<index>:<json>`)

useWorkflowStream (apps/web)
  parts ──▶ pipelineStagesAtom + groupsAtom
  iteration.html set once per frame (frameComplete output or final frames[])
  DesignFrame renders iframe srcDoc when isLoading → false
```

Facts that shape feasibility:

- **Partial text already exists in-process.** `layoutStep` calls `streamAnthropic`, which returns the AI SDK `streamText` result — but the step awaits `stream.text` (the *complete* string). `stream.textStream` (or `fullStream`) yields incremental chunks with zero provider changes. The layout step even emits a 5s heartbeat — an emit channel is already in place.
- **All other steps are `generateText` calls** (plan, images, review, critique, summary via `generateWithFallback`). Only layout and review rewrite user-visible HTML; images patches placeholders into the layout result. So layout is the only stage where streaming partials has real payoff — it is also by far the longest stage.
- **The wire is additive-friendly.** Parts are `type`-tagged JSON lines; a new `data-frame-partial` part type is ignored safely by both consumers (`use-workflow-stream` switches on `part.type`; `use-post-revision` only reads `collectResults`).
- **Completion semantics are already progressive.** `frameComplete` events (added for #79) carry each `FrameResult` as it lands — frames mount one by one. Progressive *partial* rendering is strictly additional.
- **Current preview is a one-shot atomic swap.** `DesignFrame` sets `srcDoc` once, measures height via `postMessage` at fixed timers (300/800/2000 ms), with a `|| 100` fallback that collapses un-laid-out frames to ~100px slivers. A sibling session may already be fixing this with `ResizeObserver` — **treat continuous measurement as a hard dependency, not a nice-to-have** (see Risks).

## What it would take

### 1. Pipeline emits partials (`packages/pipeline`)

- `layoutStep`: consume `stream.textStream` alongside the existing `stream.text` await; accumulate text and `ctx.emit({ type: "partial", step: "layout", frameIndex, html: accumulated })` on a throttle (~250–500 ms or every N chars), not per token.
- `stream.ts`: pass a `partial` event through as a new SSE part (e.g. `{ type: "data-frame-partial", frameIndex, html }`) rather than wedging it into the `steps` record — keeps `data-workflow` consumers and snapshot semantics untouched.
- Same pattern could later stream `review` output, but review only runs in sequential mode and rewrites rather than extends — lower value.

### 2. Preview transport into the iframe

Two viable mechanisms; only one survives scrutiny.

| Approach | Verdict | Why |
| --- | --- | --- |
| Re-set `srcDoc` per partial | ❌ | Each set is a full document reload — Tailwind CDN refetch, layout thrash, scroll/height state loss, visible flash per tick. Fine at ~4 fps for a prototype demo, janky in practice. |
| Persistent iframe + `postMessage` | ✅ | Frame loads the shell (Tailwind script, measure code) **once**; parent posts `{type:"calca-frame-partial", html}`; frame does `measureEl.innerHTML = html`. No reloads, one script fetch, continuous measurement. |

The iframe already posts *out* (`calca-frame-height` with a generation counter); the reverse channel is symmetric — `window.postMessage` to `iframe.contentWindow`, guarded by iteration id + generation nonce, same as the existing `measuredRef`/`gen` pattern.

### 3. Sandboxing model — unchanged, but note the asymmetry

Current: `sandbox="allow-scripts"` (no `allow-same-origin`) — srcdoc runs on an opaque origin; model HTML can't reach the parent except `postMessage`. Feeding partial HTML through `postMessage` → `innerHTML` **inside the same sandbox** keeps the trust boundary identical: untrusted markup still executes only in the opaque-origin frame.

One real difference: `innerHTML` injection vs `srcDoc` document write. `innerHTML` drops `<script>` tags in the injected markup (they don't execute — actually a *safety improvement* over srcdoc, where inline scripts do run). Generated layouts shouldn't need scripts anyway; if they do, they silently don't work in preview but do in final srcdoc — acceptable, and arguably safer.

### 4. Cancellation and rollback

- **Cancel**: `AbortController` already propagates client → stream `cancel()` → pipeline `signal`; `removePendingIterations` drops `isLoading` iters. A preview iframe is part of the iteration — it dies with it. No new machinery.
- **Rollback**: partial HTML is speculative — `images` rewrites placeholders, `review` may rewrite whole sections, `errorFrame` replaces wholesale. Rollback = `srcDoc` swap to authoritative output on `frameComplete`. The final frame is the source of truth; nothing persists the preview.
- **Mid-flight malformed HTML**: browsers render partial markup gracefully (unclosed tags auto-close). Worst case is a visually broken *preview* that self-corrects on the next chunk. Optional guard: don't render until the accumulated text parses to ≥1 top-level element.

## Risks

- **Height thrash** — continuous re-measurement while streaming = canvas layout shift every tick. Mitigate: throttle partials, debounce height application, and **land the `ResizeObserver`-in-srcdoc fix first** (the one-shot timer + `|| 100` fallback is already broken headless). This is the sibling session's known weakness — progressive preview *depends* on it.
- **CLS on the canvas** — node height changes reflow the React Flow layout and can nudge adjacent frames mid-drag. Throttle + only grow (never shrink) during preview mitigates.
- **Bandwidth** — partial HTML re-serializes the full accumulated text per tick; a 40KB layout × 4 frames × 2 Hz ≈ 320KB/s worst case. Throttle + emit-only-on-change + a cap (e.g. ≤1 update/500ms/frame) keeps it reasonable on localhost/BYOK setups; revisit before shipping remote-hosted.
- **Speculative confusion** — a half-rendered frame could look like a broken result. Needs a persistent "preview" affordance (badge or reduced opacity) so users read it as work-in-progress, not a bug.
- **Two render paths** — preview (innerHTML in persistent frame) and final (srcDoc) can diverge subtly (scripts, document-level CSS, `100vh` fixups applied in the srcdoc template but not the preview doc). Keep the *same* wrapper template for both paths and inject partials into its `#calca-measure` mount point only.

## Recommendation

**Feasible and worth doing — in stages, not all at once.**

1. **Stage 0 (done, this PR)** — real stage visibility: per-frame step checklist + elapsed time + early `frameComplete` mounting. Most of the "I can't tell what's happening" pain is observability, solved without speculative rendering.
2. **Stage 1 (prereq)** — land the srcdoc measurement fix (`ResizeObserver`, drop the `|| 100` fallback). Progressive preview without it ships the flicker at 2 Hz.
3. **Stage 2** — pipeline partial emits for `layout` only + `data-frame-partial` wire part + client fan-in (new atom or extend `PipelineStatus` with `partialHtml`), still rendering into the *existing* srcdoc path but throttled. This alone is the 80% win: users see markup materialize.
4. **Stage 3** — persistent preview iframe + `postMessage` innerHTML updates + "preview" badge; atomic swap on `frameComplete`. Measure flicker/CLS; keep behind a flag (`?progressive=1`) for one release before defaulting on.

Skip speculative *execution* (pre-running images/review on partial layout output) for now: those steps take complete HTML by contract, images does real network work per placeholder, and the ROI is poor until Stage 3 proves the UX. Revisit if layout TTFB (time-to-first-partial) still leaves a >10s dead window.
