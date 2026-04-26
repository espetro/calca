# ADR-0013: Brand Voice for Calca

## Metadata

- **Status**: Accepted
- **Date**: 2026-04-26
- **Decision makers**: Product owner, frontend team

## Context and Problem Statement

Calca is rebranding from the working names "Gosto" and "Otto" to a single, cohesive identity. A critical part of that rebrand is the voice we use across every surface of the product. Without a documented voice, copy tends to drift toward formality, jargon, or generic SaaS defaults — none of which match the tool's goal of feeling like a creative companion rather than a software utility.

The challenge: define a voice that is warm and approachable, aligns with design-tool expectations, and can be maintained by any contributor who writes user-facing text.

## Decision Drivers

* The product sits at the intersection of AI and design — it must feel capable without being complicated
* Users range from casual sketchers to professional designers — tone must work for both
* The UI is dense with canvas, frames, and layers — copy must clarify, not clutter
* Future i18n support requires a voice that translates well (short, active sentences)

## Considered Options

* **Option A: Formal / Enterprise voice** — Precise, structured, button labels like "Initialize Session" and "Confirm Action". Rejected: too cold for a creative tool.
* **Option B: Playful / Quirky voice** — Jokes, emojis, exclamation marks, "Let's goooo!". Rejected: undermines trust in an AI design tool.
* **Option C: Warm & Approachable** — A knowledgeable friend, not a manual. Clear, encouraging, never patronizing. **Chosen.**

## Decision Outcome

Chosen option: **"Warm & Approachable"**

We adopt the brand voice defined in the Calca brand voice guide — four pillars, vocabulary rules, and copy patterns for each UI surface. Every piece of user-facing text must pass the "would a smart friendly designer say this out loud?" test.

### Voice Pillars

1. **Capable, not complicated** — Calca is powerful, but we never make the user feel small. Explain what something does in one line.
2. **Short, active sentences** — Subject-verb-object. No filler.
3. **Encouraging without being patronizing** — "Start sketching" beats "You're ready to get started!" every time.
4. **Confident but never bossy** — We make recommendations, not demands.

### Vocabulary Rules

| Use | Avoid |
|-----|-------|
| canvas, frame, layer, trace, sketch | workspace, interface, widget, tool |
| bring in, drop, place, adjust | import, upload, configure, configure settings |
| something went wrong | error, failed to, attempt, initialized |

*"Trace" is used as a subtle brand thread — trace an idea, trace a reference image, trace your next step.*

### Forbidden Patterns

* No form defaults: "Submit", "Confirm", "OK", "Cancel" — use action verbs instead
* No exclamation marks for manufactured excitement
* No "please" — polite but adds noise

### Consequences

* Good: All copy feels like it came from the same person — builds trust and recognition
* Good: Short, active sentences reduce translation complexity for future i18n work
* Good: The "knowledgeable friend" tone makes dense design-tool UI feel approachable
* Bad: Requires discipline — every new feature must have copy reviewed against the voice guide
* Bad: Occasional tension between brevity and clarity; voice guide must be the tie-breaker
* Neutral: The vocabulary list may evolve as new features introduce new concepts

## Validation

* Copy audit every quarter — spot-check 20 random strings against the voice pillars
* Track user feedback for tone-related complaints (e.g., "too formal", "too cutesy")
* If i18n expansion reveals voice patterns that don't translate, revisit vocabulary rules

## More Information

* Brand voice guide: `tmp/copy.md`
* Related: PRD v2 design philosophy (`docs/prd-v2.md`)
