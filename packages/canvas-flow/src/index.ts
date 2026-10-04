export { CanvasArea } from "./components/CanvasArea";
export type { CanvasAreaProps } from "./components/CanvasArea";

export { CanvasProvider } from "./components/CanvasProvider";

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

export {
  CanvasStoreProvider,
  FlowCanvas,
  projectStore,
  useCanvasNodes,
  useCanvasStore,
} from "./adapter";
export type { BindingView, CanvasProjection, CanvasViews, ShapeView } from "./adapter";

export {
  calcaViews,
  CANVAS_IMAGE_TYPE,
  DESIGN_FRAME_TYPE,
  imageToRecord,
  iterationToRecord,
} from "./views";
export type { CalcaCanvasContext } from "./views";
