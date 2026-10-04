# @calca/canvas-base

Zero-dependency, runtime-agnostic document core for the Calca canvas. Web Standards only (ESM + `EventTarget`) — runs on Node ≥20.19, Bun, Deno, and workers. Contains no React or `@xyflow/*`; the React Flow projection lives in `@calca/canvas-flow`.

## Model

- **Records** — `ShapeRecord` (id, type, `parentId`, fractional `index`, `props`, `meta`) and `BindingRecord` (`fromId`/`toId`), held in flat maps on `CanvasStore`.
- **Ordering** — `keys.ts` fractional indices (`generateKeyBetween`, `generateNKeysBetween`) for stable, O(1) reordering under user/agent/remote writes.
- **Commands** — `create-shape` | `create-binding` | `update` | `delete` | `reparent`. All mutations go through `store.apply(commands, { origin, history })`, which computes inverse commands, updates history, and emits a `change` event (`CustomEvent<CanvasChange>`) with `{ origin, commands, inverse, added, updated, removed }`.
- **History** — `transact(fn)` groups `apply` calls into one undo entry; `history: false` for remote/derived changes. `undo()` / `redo()`.
- **Persistence** — `snapshot()` / `load()` on a versioned `CanvasSnapshot`; ordered `Migration`s run on load and future versions are rejected.
- **Types** — `ShapeDef<P>` carries an optional [Standard Schema](https://standardschema.dev) `schema` (type-only dev dependency; bring your own zod/valibot/arktype) plus `defaultProps`. Validation runs inside `apply`.

```ts
import { createCanvasStore, generateKeyBetween } from "@calca/canvas-base";

const store = createCanvasStore();
store.addEventListener("change", (e) => console.log(e.detail));

store.apply([
  {
    op: "create-shape",
    record: {
      id: "frame-1",
      type: "frame",
      parentId: null,
      index: generateKeyBetween(null, null),
      props: { x: 0, y: 0, w: 640, h: 480 },
    },
  },
], { origin: "agent" });
```
