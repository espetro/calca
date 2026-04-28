import { useAtomValue } from "jotai";

import { rubberBandAtom } from "#/features/design/state/generation-atoms";

export const RubberBandOverlay = () => {
  const rubberBand = useAtomValue(rubberBandAtom);

  if (!rubberBand) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none z-[60] border border-blue-400/50 bg-blue-400/10 rounded-sm"
      style={{
        height: Math.abs(rubberBand.currentY - rubberBand.startY),
        left: Math.min(rubberBand.startX, rubberBand.currentX),
        top: Math.min(rubberBand.startY, rubberBand.currentY),
        width: Math.abs(rubberBand.currentX - rubberBand.startX),
      }}
    />
  );
};
