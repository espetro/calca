interface RubberBandOverlayProps {
  rubberBand: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
}

export function RubberBandOverlay({ rubberBand }: RubberBandOverlayProps) {
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
}
