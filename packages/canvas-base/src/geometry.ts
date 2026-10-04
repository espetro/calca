import type { Bounds, Point } from "./records";

export const boundsContains = (outer: Bounds, inner: Bounds): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

export const boundsOverlap = (a: Bounds, b: Bounds): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const pointInBounds = (point: Point, bounds: Bounds): boolean =>
  point.x >= bounds.x &&
  point.x <= bounds.x + bounds.w &&
  point.y >= bounds.y &&
  point.y <= bounds.y + bounds.h;

export const unionBounds = (bounds: readonly Bounds[]): Bounds | null => {
  if (bounds.length === 0) return null;
  const x = Math.min(...bounds.map((b) => b.x));
  const y = Math.min(...bounds.map((b) => b.y));
  const right = Math.max(...bounds.map((b) => b.x + b.w));
  const bottom = Math.max(...bounds.map((b) => b.y + b.h));
  return { x, y, w: right - x, h: bottom - y };
};

export const centerOf = (bounds: Bounds): Point => ({
  x: bounds.x + bounds.w / 2,
  y: bounds.y + bounds.h / 2,
});

export const translate = (bounds: Bounds, delta: Point): Bounds => ({
  ...bounds,
  x: bounds.x + delta.x,
  y: bounds.y + delta.y,
});

export interface Camera {
  x: number;
  y: number;
  /** Zoom scale; 1 = 100%. */
  z: number;
}

export const screenToCanvas = (point: Point, camera: Camera): Point => ({
  x: point.x / camera.z - camera.x,
  y: point.y / camera.z - camera.y,
});

export const canvasToScreen = (point: Point, camera: Camera): Point => ({
  x: (point.x + camera.x) * camera.z,
  y: (point.y + camera.y) * camera.z,
});
