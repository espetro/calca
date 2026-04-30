import { useEffect, useRef, useState } from "react";

import type {
  Comment as CommentType,
  DesignIteration,
  PipelineStatus,
  Point,
} from "#/shared/types";
import { useMountEffect } from "#/shared/utils/use-mount-effect";

export const DEFAULT_FRAME_WIDTH = 480;
const FRAME_WIDTH = DEFAULT_FRAME_WIDTH; // Kept for export compat
const INITIAL_IFRAME_HEIGHT = 2000; // Start tall, measure down

interface DesignCardProps {
  iteration: DesignIteration;
  isCommentMode: boolean;
  isSelectMode: boolean;
  isDragging: boolean;
  isSelected?: boolean;
  onSelect?: (e?: React.MouseEvent) => void;
  onAddComment: (iterationId: string, position: Point) => void;
  onClickComment: (comment: CommentType, iterationId: string) => void;
  onDragStart: (e: React.MouseEvent) => void;
  scale: number;
  pipelineStatus?: PipelineStatus;
}

export function DesignCard({
  iteration,
  isCommentMode,
  isSelectMode,
  isDragging,
  isSelected,
  onSelect,
  onAddComment,
  onClickComment,
  onDragStart,
  scale,
  pipelineStatus,
}: DesignCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(320);
  const measuredRef = useRef(false);
  const measurementGenRef = useRef(0);

  // Build srcdoc — wrap content in a measuring div to get exact height
  const frameW = iteration.width || FRAME_WIDTH;
  const srcdoc =
    iteration.html && !iteration.isLoading
      ? `<!DOCTYPE html>
<html style="height:auto;overflow:hidden;"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
  const _origWarn = console.warn;
  console.warn = function(...args) {
    if (typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
    _origWarn.apply(console, args);
  };
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: hidden; }
    body { background: white; width: ${frameW}px; }
    #calca-measure { width: ${frameW}px; overflow: hidden; }
    img, video, svg { max-width: 100%; height: auto; display: block; object-fit: cover; }
    * { animation: none !important; transition: none !important; }
    /* Kill common viewport-height patterns that inflate measurement */
    [style*="100vh"], [style*="min-height: 100vh"], [style*="height: 100vh"] { height: auto !important; min-height: 0 !important; }
  </style>
</head><body><div id="calca-measure" data-gen="${measurementGenRef.current}">${iteration.html}</div>
<script>
var GEN = ${measurementGenRef.current};
function reportHeight() {
  var el = document.getElementById('calca-measure');
  if (!el) return;
  var h = el.offsetHeight || el.scrollHeight || 100;
  parent.postMessage({ type: 'calca-frame-height', id: '${iteration.id}', height: h, gen: GEN }, '*');
}
setTimeout(reportHeight, 300);
setTimeout(reportHeight, 800);
setTimeout(reportHeight, 2000);
</script></body></html>`
      : undefined;

  // Listen for height messages from sandboxed iframe
  // oxlint-disable-next-line
  useEffect(() => {
    if (!iteration.html || iteration.isLoading) {
      return;
    }
    measuredRef.current = false;
    measurementGenRef.current += 1;
    const currentGen = measurementGenRef.current;

    // If we have a size hint from the model, use it as the initial content height
    if (iteration.height) {
      setContentHeight(iteration.height);
    }

    const onMessage = (e: MessageEvent) => {
      if (
        e.data?.type === "calca-frame-height" &&
        e.data.id === iteration.id &&
        e.data.gen === currentGen
      ) {
        const h = Math.min(Math.max(e.data.height, 50), 12_000);
        if (!iteration.height || iteration.height === 0 || Math.abs(h - iteration.height) > 30) {
          setContentHeight(h);
          measuredRef.current = true;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iteration.html, iteration.isLoading, iteration.id, iteration.height]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isCommentMode) {
      return;
    }
    e.stopPropagation();

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    onAddComment(iteration.id, { x, y });
  };

  // Use measured content height, fallback to model hint
  // Use measured height if available, then size hint, then default
  const frameHeight = iteration.isLoading ? 320 : contentHeight;

  return (
    <div
      className={`absolute ${isDragging ? "z-50" : ""}`}
      data-tour="design-frame"
      style={{
        left: iteration.position.x,
        top: iteration.position.y,
        width: iteration.width || FRAME_WIDTH,
      }}
    >
      <div className="mb-2 flex items-center gap-2 group/label">
        <span className="text-xs font-medium text-gray-500/80 bg-white/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/40">
          {iteration.label}
        </span>
      </div>

      {/* Frame — fixed width, NO transitions on any dimension */}
      <div
        ref={wrapperRef}
        onClick={(e) => {
          handleClick(e);
          if (isSelectMode && onSelect) {
            e.stopPropagation();
            onSelect(e);
          }
        }}
        onMouseDown={(e) => {
          if (isSelectMode) {
            e.stopPropagation();
            onDragStart(e);
          }
        }}
        className={`relative bg-white rounded-xl shadow-md border overflow-hidden transition-shadow ${
          isSelected ? "ring-2 ring-blue-500 border-blue-400/50 shadow-lg" : "border-gray-200/80"
        } ${
          isCommentMode
            ? "cursor-crosshair ring-2 ring-blue-400/20 hover:ring-blue-400/40"
            : isSelectMode
              ? isDragging
                ? "cursor-grabbing shadow-xl ring-2 ring-blue-400/30"
                : "cursor-grab hover:shadow-lg"
              : ""
        }`}
        style={{ height: frameHeight, width: iteration.width || FRAME_WIDTH }}
      >
        {/* No revision overlay — comment pins show status instead */}

        {iteration.isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 animate-spin" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="url(#spinner-gradient)"
                  strokeWidth="3"
                  strokeDasharray="80"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="spinner-gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-[12px] font-medium text-gray-400">Generating...</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title={iteration.label}
            sandbox="allow-scripts"
            srcDoc={srcdoc}
            style={{
              border: "none",
              display: "block",
              height: measuredRef.current
                ? contentHeight
                : iteration.height || INITIAL_IFRAME_HEIGHT,
              pointerEvents: "none",
              width: iteration.width || FRAME_WIDTH,
            }}
          />
        )}

        {/* Comment pins — only visible in comment mode */}
        {isCommentMode &&
          iteration.comments.map((comment) => (
            <CommentPin
              key={comment.id}
              comment={comment}
              onClick={() => onClickComment(comment, iteration.id)}
            />
          ))}
      </div>
    </div>
  );
}

export { FRAME_WIDTH };

const STATUS_COLORS = {
  done: {
    bg: "bg-emerald-500",
    shadow: "rgba(16,185,129,0.4)",
    anchor: "bg-emerald-400/60",
    ping: "bg-emerald-400/30",
  },
  waiting: {
    bg: "bg-gray-400",
    shadow: "rgba(156,163,175,0.4)",
    anchor: "bg-gray-400/60",
    ping: "bg-gray-400/30",
  },
  working: {
    bg: "bg-amber-500",
    shadow: "rgba(245,158,11,0.4)",
    anchor: "bg-amber-400/60",
    ping: "bg-amber-400/30",
  },
} as const;

function CommentPin({ comment, onClick }: { comment: CommentType; onClick: () => void }) {
  const [isNew, setIsNew] = useState(true);

  useMountEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 2000);
    return () => clearTimeout(timer);
  });

  const status = comment.status || "waiting";
  const colors = STATUS_COLORS[status];
  const isWorking = status === "working";

  return (
    <div
      className="absolute z-20"
      style={{
        left: comment.position.x - 14,
        top: comment.position.y - 14,
      }}
    >
      {(isNew || isWorking) && (
        <span className={`absolute inset-0 rounded-full ${colors.ping} animate-ping`} />
      )}
      <span className={`absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-2 ${colors.anchor}`} />
      <button
        className={`relative w-7 h-7 rounded-full ${colors.bg} text-white text-[11px] font-bold flex items-center justify-center hover:scale-110 transition-all cursor-pointer border-2 border-white`}
        style={{ boxShadow: `0 2px 8px ${colors.shadow}` }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title={comment.aiResponse || comment.text}
      >
        {status === "done" ? "✓" : comment.number}
      </button>
    </div>
  );
}
