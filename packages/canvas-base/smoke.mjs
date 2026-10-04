/**
 * Runtime smoke test for @calca/canvas-base — pure Web Standards, must run
 * unchanged under `node`, `bun`, and `deno run`:
 *   node packages/canvas-base/smoke.mjs
 *   bun packages/canvas-base/smoke.mjs
 *   deno run --allow-read packages/canvas-base/smoke.mjs
 */

import {
  CANVAS_CHANGE_EVENT,
  createCanvasStore,
  generateKeyBetween,
  generateNKeysBetween,
  isValidIndex,
} from "./dist/index.mjs";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`smoke: ${msg}`);
};

// Fractional keys
const k1 = generateKeyBetween(null, null);
const k2 = generateKeyBetween(k1, null);
const [m1, m2] = generateNKeysBetween(k1, k2, 2);
assert(isValidIndex(k1) && isValidIndex(k2), "keys valid");
assert(k1 < m1 && m1 < m2 && m2 < k2, "n-keys ordered");

// Store lifecycle: apply → change event → undo → snapshot → load
const store = createCanvasStore();
let changes = 0;
store.addEventListener(CANVAS_CHANGE_EVENT, () => changes++);

store.apply(
  [
    {
      op: "create-shape",
      record: {
        id: "frame-1",
        type: "frame",
        parentId: null,
        index: k1,
        props: { x: 0, y: 0 },
      },
    },
    {
      op: "create-binding",
      record: {
        id: "edge-1",
        type: "edge",
        fromId: "frame-1",
        toId: "frame-1",
        index: k1,
        props: {},
      },
    },
  ],
  { origin: "agent" },
);
assert(changes === 1, "one change event per apply");
assert(store.shapes().length === 1 && store.bindings().length === 1, "records stored");

store.undo();
assert(store.shapes().length === 0, "undo removes");
store.redo();
assert(store.shapes().length === 1, "redo restores");

const snapshot = store.snapshot();
const other = createCanvasStore({ snapshot });
assert(
  JSON.stringify(other.snapshot()) === JSON.stringify(snapshot),
  "snapshot round-trips",
);

console.log("canvas-base smoke: OK");
