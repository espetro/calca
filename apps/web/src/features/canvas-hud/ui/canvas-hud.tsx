import BugIcon from "#/features/feedback/ui/bug-icon";

import Compass from "./compass";
import ZoomControls from "./zoom";

export interface CanvasHUDProps {
  scale: number;
  offset: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const CanvasHUD = ({
  scale,
  offset,
  onZoomIn,
  onZoomOut,
  onResetView,
}: CanvasHUDProps) => (
  <div
    className="fixed bottom-4 right-4 z-50 flex items-center rounded-2xl p-1 bg-toolbar-bg-transparent backdrop-blur border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)]"
  >
    <Compass offset={offset} onResetView={onResetView} />
    <ZoomControls
      scale={scale}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
    />
    <BugIcon />
  </div>
);

export default CanvasHUD;
