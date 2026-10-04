import { createCanvasStore } from "@calca/canvas-base";
import { describe, expect, it } from "vitest";

import { projectStore } from "./projection";
import type { CanvasViews } from "./types";

interface Ctx {
  selected: Set<string>;
  flag: boolean;
}

const views: CanvasViews<Ctx> = {
  shapes: {
    box: {
      nodeType: "boxNode",
      position: (r) => (r.props as { position: { x: number; y: number } }).position,
      data: (r, ctx) => ({ flag: ctx.flag, label: r.props.label }),
      selected: (r, ctx) => ctx.selected.has(r.id),
      draggable: () => false,
    },
  },
};

const ctx: Ctx = { selected: new Set(["a"]), flag: true };

const makeStore = () => {
  const store = createCanvasStore();
  store.apply(
    [
      {
        op: "create-shape",
        record: {
          id: "b",
          type: "box",
          parentId: null,
          index: "W",
          props: { position: { x: 5, y: 5 }, label: "second" },
        },
      },
      {
        op: "create-shape",
        record: {
          id: "a",
          type: "box",
          parentId: null,
          index: "V",
          props: { position: { x: 1, y: 2 }, label: "first" },
        },
      },
      {
        op: "create-shape",
        record: {
          id: "ghost",
          type: "unregistered",
          parentId: null,
          index: "X",
          props: {},
        },
      },
      {
        op: "create-binding",
        record: { id: "e1", type: "edge", fromId: "a", toId: "b", index: "V", props: {} },
      },
    ],
    { origin: "user" },
  );
  return store;
};

describe("projectStore", () => {
  it("projects shapes to nodes in fractional-index order, skipping unviewed types", () => {
    const { nodes } = projectStore(makeStore(), views, ctx);
    expect(nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(nodes[0]).toMatchObject({
      type: "boxNode",
      position: { x: 1, y: 2 },
      selected: true,
      draggable: false,
      data: { flag: true, label: "first" },
    });
  });

  it("projects bindings to edges", () => {
    const { edges } = projectStore(makeStore(), views, ctx);
    expect(edges).toEqual([{ id: "e1", source: "a", target: "b" }]);
  });
});
