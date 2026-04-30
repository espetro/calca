import ToolButton from "#/widgets/toolbar/ui/tool-button";

export interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls = ({ onZoomIn, onZoomOut, scale }: ZoomControlsProps) => (
  <>
    <ToolButton onClick={onZoomOut} title="Zoom out">
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </ToolButton>

    <span className="text-[11px] font-medium text-toolbar-text px-1.5 py-1 rounded-lg min-w-[42px] text-center transition-colors">
      {Math.round(scale * 100)}%
    </span>

    <ToolButton onClick={onZoomIn} title="Zoom in">
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </ToolButton>
  </>
);

export default ZoomControls;

