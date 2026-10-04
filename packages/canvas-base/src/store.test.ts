import { describe, expect, it } from "vitest";

import type { ShapeRecord } from "./records";
import type { ShapeDef } from "./shapes";
import {
  CANVAS_CHANGE_EVENT,
  createCanvasStore,
  type CanvasChange,
  type CanvasSnapshot,
} from "./store";

const shape = (id: string, index = "V", parentId: string | null = null): ShapeRecord => ({
  id,
  type: "frame",
  parentId,
  index,
  props: { x: 0, y: 0, w: 100, h: 100 },
});

const makeStore = (defs?: ShapeDef[]) => createCanvasStore({ defs });

describe("CanvasStore", () => {
  it("applies create/update/delete and reports changed ids", () => {
    const store = makeStore();
    const events: CanvasChange[] = [];
    store.addEventListener(CANVAS_CHANGE_EVENT, (e) =>
      events.push((e as CustomEvent<CanvasChange>).detail),
    );

    store.apply([{ op: "create-shape", record: shape("f1") }], { origin: "user" });
    store.apply([{ op: "update", id: "f1", props: { x: 10 } }], { origin: "agent" });
    store.apply([{ op: "delete", id: "f1" }], { origin: "remote" });

    expect(store.get("f1")).toBeUndefined();
    expect(events).toHaveLength(3);
    expect(events[0]!.added).toEqual(["f1"]);
    expect(events[1]!.origin).toBe("agent");
    expect(events[1]!.updated).toEqual(["f1"]);
    expect(events[2]!.removed).toEqual(["f1"]);
  });

  it("undo/redo restores state and is grouped by transaction", () => {
    const store = makeStore();
    store.transact(() => {
      store.apply([{ op: "create-shape", record: shape("a") }], { origin: "user" });
      store.apply([{ op: "create-shape", record: shape("b") }], { origin: "user" });
    });
    expect(store.shapes()).toHaveLength(2);

    store.undo();
    expect(store.shapes()).toHaveLength(0);
    expect(store.canRedo).toBe(true);

    store.redo();
    expect(store.shapes()).toHaveLength(2);
  });

  it("undo of update restores previous props", () => {
    const store = makeStore();
    store.apply([{ op: "create-shape", record: shape("a") }], { origin: "user" });
    store.apply([{ op: "update", id: "a", props: { x: 50 } }], { origin: "user" });
    store.undo();
    expect(store.getShape("a")!.props.x).toBe(0);
    store.redo();
    expect(store.getShape("a")!.props.x).toBe(50);
  });

  it("reparent moves shapes and generates an index when omitted", () => {
    const store = makeStore();
    store.apply(
      [
        { op: "create-shape", record: shape("parent") },
        { op: "create-shape", record: shape("child") },
        { op: "create-shape", record: shape("sibling") },
      ],
      { origin: "user" },
    );
    store.apply([{ op: "reparent", id: "sibling", parentId: "parent" }], { origin: "user" });
    const children = store.children("parent");
    expect(children.map((s) => s.id)).toEqual(["sibling"]);
    expect(children[0]!.index > "V").toBe(true);

    store.undo();
    expect(store.getShape("sibling")!.parentId).toBeNull();
    expect(store.getShape("sibling")!.index).toBe("V");
  });

  it("orders children by fractional index", () => {
    const store = makeStore();
    const a = shape("a", store.nextIndex(null));
    store.apply([{ op: "create-shape", record: a }], { origin: "user" });
    const b = shape("b", store.nextIndex(null));
    store.apply([{ op: "create-shape", record: b }], { origin: "user" });
    expect(store.children(null).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("snapshot round-trips through load()", () => {
    const store = makeStore();
    store.apply(
      [
        { op: "create-shape", record: shape("a") },
        {
          op: "create-binding",
          record: { id: "e1", type: "arrow", fromId: "a", toId: "a", index: "V", props: {} },
        },
      ],
      { origin: "user" },
    );
    const snap = store.snapshot();

    const other = createCanvasStore({ snapshot: snap });
    expect(other.shapes()).toHaveLength(1);
    expect(other.bindings()).toHaveLength(1);
    expect(other.snapshot()).toEqual(snap);
  });

  it("runs migrations on load and rejects future versions", () => {
    const snap: CanvasSnapshot = {
      version: 0,
      shapes: [shape("a")],
      bindings: [],
    };
    const store = createCanvasStore({
      migrations: [
        {
          version: 1,
          up: (s) => ({
            ...s,
            shapes: s.shapes.map((sh) => ({ ...sh, meta: { migrated: true } })),
          }),
        },
      ],
    });
    store.load(snap);
    expect(store.getShape("a")!.meta?.migrated).toBe(true);
    expect(() => store.load({ version: 99, shapes: [], bindings: [] })).toThrow();
  });

  it("validates props against a registered Standard Schema", () => {
    const defs: ShapeDef[] = [
      {
        type: "frame",
        schema: {
          "~standard": {
            version: 1,
            vendor: "test",
            validate: (v) =>
              typeof v === "object" && v !== null && "w" in v
                ? { value: v as Record<string, unknown> }
                : { issues: [{ message: "missing w" }] },
          },
        },
      },
    ];
    const store = makeStore(defs);
    store.apply([{ op: "create-shape", record: shape("ok") }], { origin: "user" });
    expect(() =>
      store.apply([{ op: "create-shape", record: { ...shape("bad"), props: {} } }], {
        origin: "user",
      }),
    ).toThrow(/schema validation/);
  });

  it("history:false applies produce no undo entries", () => {
    const store = makeStore();
    store.apply([{ op: "create-shape", record: shape("a") }], {
      origin: "remote",
      history: false,
    });
    expect(store.canUndo).toBe(false);
  });

  it("throws on unknown ops, dupes, missing records, and missing parents", () => {
    const store = makeStore();
    store.apply([{ op: "create-shape", record: shape("a") }], { origin: "user" });
    expect(() =>
      store.apply([{ op: "create-shape", record: shape("a") }], { origin: "user" }),
    ).toThrow(/already exists/);
    expect(() =>
      store.apply([{ op: "update", id: "ghost", props: {} }], { origin: "user" }),
    ).toThrow(/does not exist/);
    expect(() =>
      store.apply([{ op: "reparent", id: "a", parentId: "ghost" }], { origin: "user" }),
    ).toThrow(/parent/);
    expect(() =>
      // @ts-expect-error deliberately malformed
      store.apply([{ op: "bogus", id: "a" }], { origin: "user" }),
    ).toThrow(/not a command/);
  });
});
