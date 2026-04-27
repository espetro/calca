import { useState, useEffect } from "react";
import { Navigation } from "lucide-react";
import ToolButton from "./tool-button";

export interface CompassProps {
  offset: { x: number; y: number };
  onResetView: () => void;
}

const Compass = ({ offset, onResetView }: CompassProps) => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dx = offset.x - size.w / 2;
  const dy = offset.y - size.h / 2;
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
