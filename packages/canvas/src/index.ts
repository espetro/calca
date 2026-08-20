export { CanvasArea } from "./components/CanvasArea";
export type { CanvasAreaProps } from "./components/CanvasArea";

export { CanvasProvider } from "./components/CanvasProvider";
export { DesignCard, DEFAULT_FRAME_WIDTH } from "./components/DesignCard";
export { DesignFrame } from "./components/DesignFrame";
export { PipelineStatusOverlay } from "./components/PipelineStatusOverlay";
export { RubberBandOverlay } from "./components/RubberBandOverlay";

export { useCanvas, useCanvasViewport } from "./hooks/use-canvas";
export type { CanvasHandle } from "./hooks/use-canvas";

export {
  copyFrames,
  cutFrames,
  pasteFrames,
  type ClipboardFramesData,
} from "./lib/frame-clipboard";

export { canvasOffsetAtom, canvasScaleAtom, isPanningAtom } from "./state/canvas-atoms";
export { groupsAtom, resetSessionAtom, hydrateGroups } from "./state/groups-atom";
