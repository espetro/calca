import type { BindingRecord, ShapeRecord } from "@calca/canvas-base";
import type { Edge } from "@xyflow/react";

/**
 * Maps one ShapeRecord `type` onto a React Flow node. `ctx` is whatever
 * render context the host passes to `<FlowCanvas data={ctx}>` — selection
 * sets, mode flags, callbacks — and is handed to `data` for the node
 * component.
 */
export interface ShapeView<C> {
  /** React Flow `nodeTypes` key this record type renders as. */
  nodeType: string;
  position: (record: ShapeRecord) => { x: number; y: number };
  size?: (record: ShapeRecord) => { width?: number; height?: number };
  data: (record: ShapeRecord, ctx: C) => Record<string, unknown>;
  selected?: (record: ShapeRecord, ctx: C) => boolean;
  draggable?: (record: ShapeRecord, ctx: C) => boolean;
  selectable?: (record: ShapeRecord, ctx: C) => boolean;
  /**
   * Props patch written back when the user drags this node. Defaults to
   * `{ position }`.
   */
  writePosition?: (
    record: ShapeRecord,
    position: { x: number; y: number },
  ) => Record<string, unknown>;
}

/** Maps one BindingRecord `type` onto a React Flow edge. */
export interface BindingView<C> {
  edge: (record: BindingRecord, ctx: C) => Partial<Edge>;
}

export interface CanvasViews<C> {
  shapes?: Record<string, ShapeView<C>>;
  bindings?: Record<string, BindingView<C>>;
}
