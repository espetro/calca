export type RecordId = string;

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ShapeRecord<P = Record<string, unknown>> {
  id: RecordId;
  /** Shape type registered via ShapeDef (e.g. "frame", "image", "note"). */
  type: string;
  /** Parent frame/group id, or null for root-level shapes. */
  parentId: RecordId | null;
  /** Fractional index ordering siblings within a parent. */
  index: string;
  /** Shape-specific payload (position, size, content refs…). */
  props: P;
  meta?: Record<string, unknown>;
}

export interface BindingRecord<P = Record<string, unknown>> {
  id: RecordId;
  /** Binding type (e.g. "arrow", "edge"). */
  type: string;
  fromId: RecordId;
  toId: RecordId;
  index: string;
  props: P;
  meta?: Record<string, unknown>;
}

export type CanvasRecord = ShapeRecord | BindingRecord;

export const isShapeRecord = (record: CanvasRecord): record is ShapeRecord => "parentId" in record;

export const isBindingRecord = (record: CanvasRecord): record is BindingRecord =>
  "fromId" in record;
