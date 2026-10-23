# Calca format manifests — reference

Format manifests declare output stacks (scripts, styles, frame attributes,
prompt hints) used when generating HTML artifacts. Files: `*.json` under
`.calca/formats/` (project) or `~/.calca/formats/` (user). Discovery walks from
cwd toward home; nearest directory wins, home is the fallback. `CALCA_FORMATS` env var overrides the search path with a single directory
(caller validates existence).

## `FormatDef` fields

| Field            | Type                     | Required | Default | Notes                                                        |
| ---------------- | ------------------------ | -------- | ------- | ------------------------------------------------------------ |
| `id`             | `string`                 | yes      | —       | Unique format id, e.g. `"html-daisyui"`                      |
| `extends`        | `string`                 | no       | —       | Parent format id; chain resolved parent-first                |
| `frameEnv`       | `Partial<FrameEnv>`      | yes      | `{}`    | Frame environment (see below)                                |
| `promptSnippets` | `Record<string, string>` | no       | —       | Stage name → prompt text injected when this format is active |
| `exporters`      | `string[]`               | no       | —       | Exporter ids supported by this format                        |

Unknown top-level keys are ignored. `frameEnv` must be present (may be `{}`).

## `FrameEnv` fields

| Field                  | Type                     | Required | Default   | Notes                                                |
| ---------------------- | ------------------------ | -------- | --------- | ---------------------------------------------------- |
| `scripts`              | `string[]`               | no       | `[]`      | Injected as `<script src>` into the frame iframe     |
| `styles`               | `string[]`               | no       | `[]`      | Injected as `<link>`                                 |
| `inlineCss`            | `string`                 | no       | —         | Inline `<style>` content appended after the reset    |
| `attrs`                | `Record<string, string>` | no       | `{}`      | HTML attributes on the frame root, e.g. `data-theme` |
| `bodyBackground`       | `string`                 | no       | `"white"` | Default frame background                             |
| `animations`           | `"none" \| "allow"`      | no       | `"none"`  | Whether frame animations run                         |
| `customCssPassthrough` | `boolean`                | no       | `false`   | Allow per-frame `customCss` injection                |

Asset paths (`scripts`, `styles`) are resolved relative to the manifest file.

## `extends` resolution

1. Walk the `extends` chain from the child to the root; cycles and unknown
   parents throw a descriptive error.
2. Merge envs parent-first, field-wise:
   - arrays (`scripts`, `styles`): child value **replaces** parent (no concat)
   - scalars (`inlineCss`, `bodyBackground`, `animations`,
     `customCssPassthrough`): child overrides when set
   - `attrs`: shallow-merged, child keys win
3. Defaults are applied last for any still-unset field.

`promptSnippets` and `exporters` are taken from the resolved (leaf) definition,
not merged down the chain.

## Merge rules for discovery

- Within one directory, each `*.json` file registers one format keyed by `id`.
- A format id found in a nearer directory shadows the same id from a farther
  directory (cwd beats `~`).
- `extends` may reference formats from any discovered directory, including
  built-ins such as `html-tailwind`.

## Examples

### daisyUI on top of the built-in Tailwind format

`.calca/formats/daisyui.json`:

```json
{
  "id": "html-daisyui",
  "extends": "html-tailwind",
  "frameEnv": {
    "styles": ["./daisyui.full.css"],
    "attrs": { "data-theme": "corporate" },
    "bodyBackground": "oklch(100% 0 0)"
  },
  "promptSnippets": {
    "layout": "Use daisyUI component classes (btn, card, navbar, drawer) rather than composing raw Tailwind utilities."
  }
}
```

### shadcn/ui-style CSS-variable tokens

`.calca/formats/shadcn-tokens.json`:

```json
{
  "id": "html-shadcn-tokens",
  "extends": "html-tailwind",
  "frameEnv": {
    "inlineCss": ":root { --background: 0 0% 100%; --foreground: 240 10% 3.9%; --primary: 240 5.9% 10%; --radius: 0.5rem; } body { background: hsl(var(--background)); color: hsl(var(--foreground)); }",
    "bodyBackground": "hsl(var(--background))"
  },
  "promptSnippets": {
    "layout": "Style with the shadcn/ui CSS variables (--background, --foreground, --primary, --radius) using hsl(var(--x)) syntax."
  }
}
```

### Dark-mode variant (child overrides theme, inherits everything else)

`.calca/formats/shadcn-tokens-dark.json`:

```json
{
  "id": "html-shadcn-dark",
  "extends": "html-shadcn-tokens",
  "frameEnv": {
    "inlineCss": ".dark { --background: 240 10% 3.9%; --foreground: 0 0% 98%; --primary: 0 0% 98%; }",
    "attrs": { "data-theme": "dark" }
  },
  "promptSnippets": {
    "layout": "Prefer the dark palette tokens; assume class 'dark' is active on the root."
  }
}
```

Note: `inlineCss` is a scalar, so the dark child **replaces** the parent's
`inlineCss` — repeat any tokens the dark theme needs rather than relying on
inheritance. `attrs` merges, so any attribute not repeated keeps the parent value.

## Inspecting resolved formats

Call `canvas.formats` to list every resolved format (built-ins plus manifests)
with its effective frame environment after `extends` resolution. Verify the
resolved stack before generating artifacts against a custom format.
