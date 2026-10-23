import type { FrameEnv } from "@calca/format/browser";
import type { Comment as CommentType, DesignIteration } from "@calca/shared";
import { useEffect, useRef, useState } from "react";

import { useMountEffect } from "../utils/use-mount-effect";

// The Tailwind runtime is bundled with the app (apps/web/public + desktop
// resources) — no CDN fetch, works offline and inside srcdoc/blob contexts.
// Resolve off document.baseURI so it lands under the app's base path
// (/app/tailwindcss.js on Pages, /tailwindcss.js in dev and on desktop).
const getTailwindScriptSrc = (): string => new URL("tailwindcss.js", document.baseURI).href;

/** Logical script token resolved to the bundled Tailwind runtime URL. */
export const TAILWIND_SCRIPT_TOKEN = "calca:tailwind";

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
  /** Failure-card copy — apps pass localized strings. */
  errorTitle?: string;
  errorHint?: string;
  /** Resolved frame environment (output-format driven rendering). When
   *  omitted the frame keeps its legacy hardcoded Tailwind behavior. */
  frameEnv?: FrameEnv;
  /** Per-frame CSS passthrough, appended last. Requires
   *  `frameEnv.customCssPassthrough`. */
  customCss?: string;
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
  errorTitle = "Generation failed",
  errorHint,
  frameEnv,
  customCss,
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
  // Skeleton-mode frames carry their own `<style>` block and no Tailwind
  // utilities — skip the CDN script so they load with zero network deps.
  const needsTailwind = iteration.html ? !iteration.html.includes("<style") : true;
  // Frame-env rendering: token-resolved scripts, stylesheet links, env-driven
  // body background, root attrs, animation policy, and custom-CSS passthrough.
  // Without a frameEnv the legacy hardcoded template below is used verbatim.
  const headExtras = frameEnv
    ? [
        ...frameEnv.scripts
          // The Tailwind runtime is only needed when the frame has no own
          // `<style>` block (skeleton frames ship their styles inline).
          .filter((src) => needsTailwind || src !== TAILWIND_SCRIPT_TOKEN)
          .map(
            (src) =>
              `<script src="${src === TAILWIND_SCRIPT_TOKEN ? getTailwindScriptSrc() : src}"></script>`,
          ),
        ...frameEnv.styles.map((href) => `<link rel="stylesheet" href="${href}">`),
      ].join("\n  ")
    : "";
  const envAttrs = frameEnv?.attrs
    ? Object.entries(frameEnv.attrs)
        .map(([key, value]) => ` ${key}="${value.replace(/"/g, "&quot;")}"`)
        .join("")
    : "";
  const allowAnimations = frameEnv?.animations === "allow";
  const envCustomCss = frameEnv?.customCssPassthrough && customCss ? `\n    ${customCss}` : "";
  const srcdoc =
    iteration.html && !iteration.isLoading
      ? `<!DOCTYPE html>
<html style="height:auto;overflow:hidden;"${envAttrs}><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${frameEnv ? headExtras : needsTailwind ? `<script src="${getTailwindScriptSrc()}"></script>` : ""}
  <style>
    html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: hidden; }
    body { background: ${frameEnv?.bodyBackground ?? "white"}; width: ${frameW}px; }
    #calca-measure { width: ${frameW}px; overflow: hidden; }
    img, video, svg { max-width: 100%; height: auto; display: block; object-fit: cover; }
    ${allowAnimations ? "" : "* { animation: none !important; transition: none !important; }"}
    [style*="100vh"], [style*="min-height: 100vh"], [style*="height: 100vh"] { height: auto !important; min-height: 0 !important; }${
      frameEnv?.inlineCss ? `\n    ${frameEnv.inlineCss}` : ""
    }${envCustomCss}
  </style>
</head><body><div id="calca-measure" data-gen="${measurementGenRef.current}">${iteration.html}</div>
<script>
var GEN = ${measurementGenRef.current};
var el = document.getElementById('calca-measure');
function reportHeight() {
  if (!el) return;
  var h = el.offsetHeight || el.scrollHeight || 100;
  parent.postMessage({ type: 'calca-frame-height', id: '${iteration.id}', height: h, gen: GEN }, '*');
}
// Layout can land after the first measurement (headless or slow paint) — the
// observer keeps reporting so the frame height self-corrects instead of
// locking to the ~100px fallback.
if (typeof ResizeObserver === 'function' && el) {
  new ResizeObserver(reportHeight).observe(el);
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
        measuredRef.current = true;
        // Always reconcile against the displayed height, not the pipeline's
        // claimed `iteration.height`: an early pre-layout report can collapse
        // the frame to ~100px, and the later correct measure must be allowed
        // to heal it even when it happens to match the claimed height.
        setContentHeight((prev) => (Math.abs(h - prev) > 4 ? h : prev));
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

  // Failed/empty frames render a failure card — never a white box. The legacy
  // placeholder pattern covers error cards persisted by older builds.
  const isError =
    iteration.status === "error" ||
    (!iteration.isLoading &&
      (!iteration.html?.trim() || iteration.html.includes('style="padding:32px;color:#666')));

  const frameHeight = iteration.isLoading ? 320 : isError ? 140 : contentHeight;

  return (
    <div
      ref={wrapperRef}
      data-tour="design-frame"
      onClick={handleClick}
      onMouseDown={onMouseDown}
      className={`relative bg-white rounded-xl shadow-md border overflow-hidden transition-shadow ${
        isSelected ? "border-blue-400/50 shadow-lg" : "border-border/60"
      } ${
        isCommentMode
          ? "cursor-crosshair ring-2 ring-blue-400/20 hover:ring-blue-400/40"
          : isSelectMode
            ? isDragging
              ? "cursor-grabbing shadow-xl ring-2 ring-blue-400/30"
              : "cursor-grab hover:shadow-lg"
            : ""
      } ${className}`}
      style={{
        ...style,
        height: frameHeight,
        width: frameW,
        // Selection ring lives in node coordinates — normalize its width against
        // canvas zoom so it stays ~3px on screen at any zoom level.
        ...(isSelected
          ? {
              outline: `${Math.max(2, 3 / scale)}px solid rgb(59 130 246)`,
              outlineOffset: 2 / scale,
            }
          : null),
      }}
    >
      {iteration.isLoading ? (
        <>
          <div className="calca-shimmer absolute inset-y-0 left-0 w-1/3" />
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <span className="calca-breathe w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground/70">Generating…</span>
          </div>
        </>
      ) : isError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 text-center">
          <svg
            className="w-5 h-5 text-muted-foreground/70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <span className="text-[12px] font-medium text-muted-foreground">{errorTitle}</span>
          {errorHint ? (
            <span className="text-[11px] text-muted-foreground/60">{errorHint}</span>
          ) : null}
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
    bg: "bg-muted-foreground",
    shadow: "rgba(156,163,175,0.4)",
    anchor: "bg-muted-foreground/60",
    ping: "bg-muted-foreground/30",
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
