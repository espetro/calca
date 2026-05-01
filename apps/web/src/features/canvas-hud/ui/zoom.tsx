import { Minus, Plus } from "lucide-react";

import ToolButton from "#/widgets/toolbar/ui/tool-button";

export interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls = ({ onZoomIn, onZoomOut, scale }: ZoomControlsProps) => (
  <>
    <ToolButton onClick={onZoomOut} title="Zoom out">
      <Minus className="w-4 h-4" />
    </ToolButton>

    <span className="text-[11px] font-medium text-toolbar-text px-1.5 py-1 rounded-lg min-w-[42px] text-center transition-colors">
      {Math.round(scale * 100)}%
    </span>

    <ToolButton onClick={onZoomIn} title="Zoom in">
      <Plus className="w-4 h-4" />
    </ToolButton>
  </>
);

export default ZoomControls;
