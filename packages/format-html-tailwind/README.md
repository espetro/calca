# @calca/format-html-tailwind

The `html-tailwind` output format for Calca frames — a `FormatDef` for
Tailwind-styled HTML rendered inside a sandboxed iframe with the Tailwind v4
browser runtime.

- `htmlTailwindFormat` — the format definition (`id: "html-tailwind"`)
- `createDefaultFormatRegistry()` — registry pre-registered with built-ins
- `TAILWIND_SCRIPT_TOKEN` — logical `frameEnv.scripts` token (`calca:tailwind`)
  the host app resolves to a real URL at render time

The Tailwind v4 runtime file itself is not bundled with the JS output: run
`bun run assets` to copy it into `dist/assets/tailwindcss.js` (a devDependency
of this package). Apps and the desktop shell copy it from there.
