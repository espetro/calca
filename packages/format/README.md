# @calca/format

Zero-dependency format seam for Calca output formats: `FormatDef` (with a Standard Schema slot for artifact validation), `FormatRegistry`, frame-env resolution with `extends` chains, and declarative manifest parsing.

```ts
import { createFormatRegistry, parseManifest, resolveFormatEnv } from "@calca/format";

const def = parseManifest(await Bun.file("format.json").json());
const registry = createFormatRegistry([def]);
const env = resolveFormatEnv(registry, def.id); // full FrameEnv with defaults
```
