import { useState } from "react";
import { Locate, LocateFixed, Navigation } from "lucide-react";
import { useViewportSize } from "@mantine/hooks";

import ToolButton from "#/widgets/toolbar/ui/tool-button";

export interface CompassProps {
  offset: { x: number; y: number };
  onResetView: () => void;
}

const Compass = ({ offset, onResetView }: CompassProps) => {
  const { width, height } = useViewportSize();
  const [isHovered, setIsHovered] = useState(false);

  const dx = offset.x - width / 2;
  const dy = offset.y - height / 2;
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI);

  const isCentred = offset.x === 0 && offset.y === 0;
  const showLocateFixed = isCentred;
  const showLocate = isHovered && !isCentred;
  const showNavigation = !isCentred && !isHovered;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ToolButton onClick={onResetView} title="Reset view">
        <span className="relative w-4 h-4 flex items-center justify-center">
          <Navigation
            className={`absolute w-4 h-4 transition-all duration-200 ${
              showNavigation ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            style={{ transform: `rotate(${angle}deg)` }}
          />
          <Locate
            className={`absolute w-4 h-4 transition-all duration-200 ${
              showLocate ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          />
          <LocateFixed
            className={`absolute w-4 h-4 transition-all duration-200 ${
              showLocateFixed ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          />
        </span>
      </ToolButton>
    </div>
  );
};

export default Compass;
