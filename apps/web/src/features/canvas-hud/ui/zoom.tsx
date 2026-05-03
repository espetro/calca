import { Minus, Plus } from "lucide-react";

import { Button } from "#/shared/components/ui/button";

export interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls = ({ onZoomIn, onZoomOut, scale }: ZoomControlsProps) => (
  <>
    <Button
      variant="ghost"
      size="icon"
      onClick={onZoomOut}
      title="Zoom out"
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
      title="Zoom in"
      className="w-8 h-8 rounded-xl text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
    >
      <Plus className="w-4 h-4" />
    </Button>
  </>
);

export default ZoomControls;
