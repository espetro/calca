import { Focus, Minus, Plus } from "lucide-react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";

export interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

const ZoomControls = ({ onZoomIn, onZoomOut, onFitView, scale }: ZoomControlsProps) => (
  <>
    <Button
      variant="ghost"
      size="icon"
      onClick={onZoomOut}
      title={m.canvashud_zoomOut()}
      className="w-8 h-8 rounded-xl text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
    >
      <Minus className="w-4 h-4" />
    </Button>

    <span className="text-[11px] font-medium text-toolbar-text px-1.5 py-1 rounded-lg min-w-[42px] text-center transition-colors">
      {Math.round(scale * 100)}%
    </span>

    <Button
      variant="ghost"
      size="icon"
      onClick={onZoomIn}
      title={m.canvashud_zoomIn()}
      className="w-8 h-8 rounded-xl text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
    >
      <Plus className="w-4 h-4" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      onClick={onFitView}
      title={m.canvashud_zoomToFit()}
      className="w-8 h-8 rounded-xl text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
    >
      <Focus className="w-4 h-4" />
    </Button>
  </>
);

export default ZoomControls;
