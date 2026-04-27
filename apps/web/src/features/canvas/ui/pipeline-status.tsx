import { type PipelineStatus, STAGE_CONFIG } from "@/shared/types";

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

  if (isDone) return null;

  const topOffset = y + frameHeight + 8;

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: topOffset, width }}>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        {!isQueued && (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isError ? "bg-destructive" : "bg-gradient-to-r from-primary to-secondary"
            } ${status.stage === "layout" || status.stage === "images" ? "animate-pulse" : ""}`}
            style={{ width: `${Math.max(status.progress * 100, 5)}%` }}
          />
        )}
      </div>
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
