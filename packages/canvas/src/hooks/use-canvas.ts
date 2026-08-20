import { useReactFlow, useViewport } from "@xyflow/react";
import { useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { canvasOffsetAtom, canvasScaleAtom } from "../state/canvas-atoms";

interface Point {
  x: number;
  y: number;
}

export type CanvasHandle = {
  offset: Point;
  scale: number;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
  screenToCanvas: (screenX: number, screenY: number, rect: DOMRect) => Point;
};

export function useCanvasViewport(): CanvasHandle {
  const { x, y, zoom } = useViewport();
  const { setViewport } = useReactFlow();
  const setCanvasOffset = useSetAtom(canvasOffsetAtom);
  const setCanvasScale = useSetAtom(canvasScaleAtom);

  useEffect(() => {
    setCanvasOffset({ x, y });
    setCanvasScale(zoom);
  }, [x, y, zoom, setCanvasOffset, setCanvasScale]);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  const zoomIn = useCallback(() => {
    setViewport({ x, y, zoom: Math.min(zoom * 1.2, 5) });
  }, [setViewport, x, y, zoom]);

  const zoomOut = useCallback(() => {
    setViewport({ x, y, zoom: Math.max(zoom * 0.8, 0.1) });
  }, [setViewport, x, y, zoom]);

  const zoomToFit = useCallback(
    (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => {
      const padding = 80;
      const contentW = bounds.maxX - bounds.minX;
      const contentH = bounds.maxY - bounds.minY;
      if (contentW <= 0 || contentH <= 0) {
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = (vw - padding * 2) / contentW;
      const scaleY = (vh - padding * 2) / contentH;
      const nextZoom = Math.min(scaleX, scaleY, 1);

      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      setViewport({
        x: vw / 2 - centerX * nextZoom,
        y: vh / 2 - centerY * nextZoom,
        zoom: nextZoom,
      });
    },
    [setViewport],
  );

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, rect: DOMRect): Point => ({
      x: (screenX - rect.left - x) / zoom,
      y: (screenY - rect.top - y) / zoom,
    }),
    [x, y, zoom],
  );

  return {
    offset: { x, y },
    scale: zoom,
    resetView,
    zoomIn,
    zoomOut,
    zoomToFit,
    screenToCanvas,
  };
}

/** Backward-compatible alias for code that still imports `useCanvas`. */
export const useCanvas = useCanvasViewport;
