import { Navigation } from "lucide-react";
import { useViewportSize } from "@mantine/hooks";

import ToolButton from "#/widgets/toolbar/ui/tool-button";

export interface CompassProps {
  offset: { x: number; y: number };
  onResetView: () => void;
}

const Compass = ({ offset, onResetView }: CompassProps) => {
  const { width, height } = useViewportSize();

  const dx = offset.x - width / 2;
  const dy = offset.y - height / 2;
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI);

  return (
    <ToolButton onClick={onResetView} title="Reset view">
      <Navigation
        className="w-4 h-4 transition-transform"
        style={{ transform: `rotate(${angle}deg)` }}
      />
    </ToolButton>
  );
};

export default Compass;
