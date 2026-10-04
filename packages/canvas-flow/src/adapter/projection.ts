import type { CanvasStore } from "@calca/canvas-base";
import type { Edge, Node } from "@xyflow/react";

import type { CanvasViews } from "./types";

export interface CanvasProjection {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Projects the document into React Flow nodes/edges. Shapes render in
 * fractional-index order (document order = paint order = z-order).
 */
export const projectStore = <C>(
  store: CanvasStore,
  views: CanvasViews<C>,
  ctx: C,
): CanvasProjection => {
  const nodes: Node[] = [];
  const shapes = store.shapes().toSorted((a, b) => (a.index < b.index ? -1 : 1));
  for (const record of shapes) {
    const view = views.shapes?.[record.type];
    if (!view) continue;
    nodes.push({
      id: record.id,
      type: view.nodeType,
      position: view.position(record),
      ...view.size?.(record),
      data: view.data(record, ctx),
      selected: view.selected?.(record, ctx) ?? false,
      draggable: view.draggable?.(record, ctx) ?? true,
      selectable: view.selectable?.(record, ctx) ?? true,
    });
  }

  const edges: Edge[] = store
    .bindings()
    .toSorted((a, b) => (a.index < b.index ? -1 : 1))
    .map((record) =>
      Object.assign(
        {
          id: record.id,
          source: record.fromId,
          target: record.toId,
        },
        views.bindings?.[record.type]?.edge(record, ctx),
      ),
    );

  return { nodes, edges };
};
