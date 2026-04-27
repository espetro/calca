import { Navigation } from "lucide-react";
import ToolButton from "./tool-button";

export interface CompassProps {
  offset: { x: number; y: number };
  onResetView: () => void;
}

const Compass = ({ offset, onResetView }: CompassProps) => {
  const angle = Math.atan2(offset.x, -offset.y) * (180 / Math.PI);

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
