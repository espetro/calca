import type { Comment as CommentType, DesignIteration } from "@app/shared";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMountEffect } from "../utils/use-mount-effect";

const getTailwindScriptSrc = (): string => {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __CALCA_DESKTOP__?: boolean }).__CALCA_DESKTOP__
  ) {
    return `${window.location.origin}/tailwindcss.js`;
  }
  return "https://cdn.tailwindcss.com";
};

export const DEFAULT_FRAME_WIDTH = 480;
const FRAME_WIDTH = DEFAULT_FRAME_WIDTH;
const INITIAL_IFRAME_HEIGHT = 2000;

interface DesignFrameProps {
  iteration: DesignIteration;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  isCommentMode?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  scale?: number;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onAddComment?: (
    iterationId: string,
    position: { x: number; y: number },
    screenX: number,
    screenY: number,
  ) => void;
  onClickComment?: (comment: CommentType, iterationId: string) => void;
}

export function DesignFrame({
  iteration,
  width,
  height: _height,
  className = "",
  style,
  isCommentMode,
  isSelectMode,
  isSelected,
  isDragging,
  scale = 1,
  onClick,
  onMouseDown,
  onAddComment,
  onClickComment,
}: DesignFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(320);
  const measuredRef = useRef(false);
  const measurementGenRef = useRef(0);

  const frameW = width || iteration.width || FRAME_WIDTH;
  const srcdoc =
    iteration.html && !iteration.isLoading
      ? `<!DOCTYPE html>
<html style="height:auto;overflow:hidden;"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="${getTailwindScriptSrc()}"></script>
  <style>
    html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: hidden; }
    body { background: white; width: ${frameW}px; }
    #calca-measure { width: ${frameW}px; overflow: hidden; }
    img, video, svg { max-width: 100%; height: auto; display: block; object-fit: cover; }
    * { animation: none !important; transition: none !important; }
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

  // oxlint-disable-next-line
  useEffect(() => {
    if (!iteration.html || iteration.isLoading) {
      return;
    }
    measuredRef.current = false;
    measurementGenRef.current += 1;
    const currentGen = measurementGenRef.current;

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
    if (isCommentMode && onAddComment && wrapperRef.current) {
      e.stopPropagation();
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      onAddComment(iteration.id, { x, y }, e.clientX, e.clientY);
    }
    onClick?.(e);
  };

  const frameHeight = iteration.isLoading ? 320 : contentHeight;

  return (
    <div
      ref={wrapperRef}
      data-tour="design-frame"
      onClick={handleClick}
      onMouseDown={onMouseDown}
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
      } ${className}`}
      style={{ ...style, height: frameHeight, width: frameW }}
    >
      {iteration.isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <div className="relative w-10 h-10">
            <Loader className="w-10 h-10 animate-spin" />
          </div>
          <span className="text-[12px] font-medium text-gray-400">Generating…</span>
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
            height: measuredRef.current ? contentHeight : iteration.height || INITIAL_IFRAME_HEIGHT,
            pointerEvents: "none",
            width: frameW,
          }}
        />
      )}

      {isCommentMode &&
        onClickComment &&
        onAddComment &&
        iteration.comments.map((comment) => (
          <CommentPin
            key={comment.id}
            comment={comment}
            onClick={() => onClickComment(comment, iteration.id)}
          />
        ))}
    </div>
  );
}

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
