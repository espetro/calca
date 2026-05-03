import { Progress } from "#/shared/components/ui/progress";
import { type PipelineStatus, STAGE_CONFIG } from "#/shared/types";

interface PipelineStatusBarProps {
  status: PipelineStatus;
  x: number;
  y: number;
  width: number;
  frameHeight: number;
}

export function PipelineStatusOverlay({
  status,
  x,
  y,
  width,
  frameHeight,
}: PipelineStatusBarProps) {
  const config = STAGE_CONFIG[status.stage];
  const isDone = status.stage === "done";
  const isError = status.stage === "error";
  const isQueued = status.stage === "queued";

  if (isDone) {
    return null;
  }

  const topOffset = y + frameHeight + 8;

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: topOffset, width }}>
      {!isQueued && (
        <Progress
          value={Math.max(status.progress * 100, 5)}
          className={`h-1 ${
            isError
              ? "[&_[data-slot=progress-indicator]]:bg-destructive"
              : "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-primary [&_[data-slot=progress-indicator]]:to-secondary"
          } ${status.stage === "layout" || status.stage === "images" ? "[&_[data-slot=progress-indicator]]:animate-pulse" : ""}`}
        />
      )}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {config.icon} {config.label}
        </span>
        {status.skipped && (
          <span className="text-[10px] font-medium text-destructive/80 whitespace-nowrap">
            ⏭ {status.reason || "Skipped"}
          </span>
        )}
      </div>
    </div>
  );
}
