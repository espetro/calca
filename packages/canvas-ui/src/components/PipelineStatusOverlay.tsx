import {
  PIPELINE_STEP_LABELS,
  PIPELINE_STEP_ORDER,
  type PipelineStatus,
  type PipelineStepState,
  STAGE_CONFIG,
} from "@calca/shared";
import { Check, Circle, X } from "lucide-react";

import { useNow } from "../utils/use-now";

interface PipelineStatusBarProps {
  status: PipelineStatus;
}

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const StepIcon = ({ status }: { status: PipelineStepState["status"] }) => {
  switch (status) {
    case "success":
      return <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />;
    case "running":
      return <span className="w-1.5 h-1.5 rounded-full bg-primary calca-breathe" />;
    case "failed":
      return <X className="w-3 h-3 text-destructive" strokeWidth={3} />;
    default:
      return <Circle className="w-3 h-3 text-muted-foreground/30" />;
  }
};

const stepTime = (step: PipelineStepState, now: number): string => {
  if (step.status === "running" && step.startedAt) {
    return formatElapsed(now - step.startedAt);
  }
  if (step.elapsedMs !== undefined) {
    return formatElapsed(step.elapsedMs);
  }
  return step.status === "failed" ? "failed" : "";
};

export function PipelineStatusOverlay({ status }: PipelineStatusBarProps) {
  const config = STAGE_CONFIG[status.stage];
  const isDone = status.stage === "done";
  const isError = status.stage === "error";
  const isQueued = status.stage === "queued";
  const now = useNow(1000, !isDone);

  if (isDone) {
    return null;
  }

  const value = Math.max(status.progress * 100, 5);
  const stepRows = PIPELINE_STEP_ORDER.filter((name) => status.steps?.[name]);

  const indicatorClass = isError ? "bg-destructive" : "bg-gradient-to-r from-primary to-secondary";
  const pulseClass = status.stage === "layout" || status.stage === "images" ? "animate-pulse" : "";

  return (
    // top:100% anchors to the card's live bottom edge — immune to the
    // label-chip offset and to measured-height lag.
    <div className="absolute top-full left-0 w-full mt-2 pointer-events-none">
      {!isQueued && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-primary/20">
          <div
            className={`h-full transition-all ${indicatorClass} ${pulseClass}`}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
      {stepRows.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {stepRows.map((name) => {
            const step = status.steps?.[name];
            if (!step) {
              return null;
            }
            const time = stepTime(step, now);
            return (
              <li key={name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                  <StepIcon status={step.status} />
                  {PIPELINE_STEP_LABELS[name]}
                </span>
                {time && (
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums whitespace-nowrap">
                    {time}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {config.icon} {config.label}
          </span>
        </div>
      )}
      {isError && (
        <span className="text-[10px] font-medium text-destructive whitespace-nowrap">
          {config.icon} {config.label}
        </span>
      )}
      {status.skipped && (
        <span className="text-[10px] font-medium text-destructive/80 whitespace-nowrap">
          ⏭ {status.reason || "Skipped"}
        </span>
      )}
    </div>
  );
}
