# ADR 0009: Format plugins & `.calca` discovery

Date: 2026-10-23 · Status: Accepted · Related: #113 (epic), #37 (three-layer v-next)

## Context

The design artifact format is hardcoded as HTML+Tailwind end-to-end: prompt construction
(`packages/pipeline/src/steps/layout.step.ts`), output contract (`packages/shared/src/schemas/layout.ts`),
frame runtime injection (`packages/canvas-ui/src/components/DesignFrame.tsx`), and export
(`apps/web/src/features/export/lib/standalone-html.ts`). The web app serves a checked-in
Tailwind v3 play-CDN bundle while desktop ships Tailwind v4 under the same filename.
Users cannot bring their own design libraries (daisyUI, shadcn tokens, custom `@theme`).

Calca's primary surface is now the MCP/CLI used by coding agents; desktop second; web is a demo.

## Decision

1. **Format seam.** A `FormatDef` interface (prompt segments, output schema, frame env:
   scripts/styles/attrs/animation policy, exporters) with a `FormatRegistry`, mirroring the
   `ShapeRegistry` precedent in `@calca/canvas-base`. The interface lives in the Apache-2.0
   library layer; implementations may sit in AGPL packages.

2. **First format package.** Current HTML+Tailwind behavior is extracted to
   `@calca/format-html-tailwind`, unified on Tailwind v4 (`@tailwindcss/browser`), shipped
   with the app (bundled by Vite) but **not** with the MCP. daisyUI/shadcn support is config
   on this format, not separate packages.

3. **Declarative-first plugins.** User formats are serializable manifests (`format.json`:
   asset paths, html attrs, prompt snippets, optional `extends` profile-of). Code-based
   `FormatDef`s are reserved for first-party packages. This is the "source plugin" tier only;
   capability and app plugins are explicitly out of scope.

4. **Upward discovery.** `.calca/formats/` resolved by walking from `process.cwd()` to the
   filesystem root and home, one parent at a time (never stopping early at repo boundaries).
   Formats merge across the chain, deeper levels overriding shallower **by format id**
   (field-wise for `frameEnv`); plain config uses nearest-wins shadowing. `~/.calca/` is the
   user-level fallback. Explicit `--formats <path>` / `CALCA_FORMATS` bypasses discovery.
   Symlinks resolved (`realpath`) before chain comparison; home is `os.homedir()`, never `$HOME`.

5. **No runtime remote loading.** Remote-git format loading is dropped as a built-in feature;
   agents clone format repos into `.calca/formats/` themselves. Remote URLs inside manifests
   are fetched at resolve-time and cached (offline-first), never hot-loaded at render.

6. **Per-tier behavior.** CLI/desktop consume manifests from the filesystem (desktop shares
   the same resolver and caches the chain). The webapp consumes bundled built-ins plus
   settings-based CSS/attr passthrough only - no loader, no fake discovery.

## Consequences

- Removes the Tailwind web/desktop divergence and the duplicated export runtime copy.
- New packages join the workspace under existing conventions (tsdown, catalogs, Apache-2.0).
- The MCP stays format-agnostic (interface only); wire format (Phase 3, #41) becomes a second
  registered format rather than special-cased code.
- A board moved between machines re-resolves formats; that is intended (portable boards).
- The webapp cannot render formats whose assets it doesn't bundle; acceptable at demo priority.
