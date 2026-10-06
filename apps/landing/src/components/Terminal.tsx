import { useEffect, useRef, useState } from "react";

type LineKind = "cmd" | "ok" | "out" | "prompt" | "tool";

interface Line {
  kind: LineKind;
  text: string;
}

const SCRIPT: Line[] = [
  { kind: "cmd", text: "npx -y @calca/mcp mcp install claude-code" },
  { kind: "ok", text: "added calca MCP server to ~/.claude.json" },
  { kind: "cmd", text: "npx -y @calca/mcp open launch-board.json" },
  { kind: "out", text: "launch-board.json: 14 record(s)" },
  { kind: "out", text: "frame: 9 · comment: 3 · stroke: 2" },
  { kind: "prompt", text: "tidy this board" },
  { kind: "tool", text: "canvas.lease → canvas.arrange grid×3" },
  { kind: "tool", text: "canvas.propose → applied · saved" },
];

const CHAR_MS = 26;
const OUT_DELAY_MS = 420;
const LINE_HOLD_MS = 620;
const END_HOLD_MS = 4200;

const PROMPTS: Record<LineKind, { glyph: string; className: string }> = {
  cmd: { glyph: "$", className: "text-slate-100" },
  ok: { glyph: "✔", className: "text-emerald-300" },
  out: { glyph: "ℹ", className: "text-slate-400" },
  prompt: { glyph: "›", className: "text-sky-300" },
  tool: { glyph: "→", className: "text-violet-300" },
};

const GLYPH_COLOR: Record<LineKind, string> = {
  cmd: "text-emerald-400",
  ok: "text-emerald-400",
  out: "text-sky-400",
  prompt: "text-sky-400",
  tool: "text-violet-400",
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function Terminal() {
  const reduced = useRef(prefersReducedMotion());
  const [visible, setVisible] = useState(reduced.current ? SCRIPT.length : 0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reduced.current) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    const run = () => {
      if (cancelled) return;
      setVisible(0);
      setTyped("");
      let t = 500;
      SCRIPT.forEach((line, i) => {
        if (line.kind === "cmd" || line.kind === "prompt") {
          for (let c = 1; c <= line.text.length; c++) {
            const slice = line.text.slice(0, c);
            after(t, () => {
              if (!cancelled) setTyped(slice);
            });
            t += CHAR_MS;
          }
          t += LINE_HOLD_MS;
          after(t, () => {
            if (!cancelled) {
              setVisible(i + 1);
              setTyped("");
            }
          });
        } else {
          t += OUT_DELAY_MS;
          after(t, () => {
            if (!cancelled) setVisible(i + 1);
          });
        }
      });
      t += END_HOLD_MS;
      after(t, run);
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const typing = !reduced.current && visible < SCRIPT.length;
  const pending = typing ? SCRIPT[visible] : null;
  const typingLine =
    pending && (pending.kind === "cmd" || pending.kind === "prompt") ? pending : null;

  return (
    <div className="rounded-2xl bg-frame p-1.5">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-[#101613]">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] text-white/40">zsh · calca</span>
        </div>
        <div className="min-h-[300px] px-5 py-4 font-mono text-[12.5px] leading-[1.9] sm:text-[13px]">
          {SCRIPT.slice(0, visible).map((line, i) => (
            <div key={i} className="flex gap-2.5 whitespace-pre-wrap break-all">
              <span className={`shrink-0 select-none ${GLYPH_COLOR[line.kind]}`}>
                {PROMPTS[line.kind].glyph}
              </span>
              <span className={PROMPTS[line.kind].className}>{line.text}</span>
            </div>
          ))}
          {typingLine && (
            <div className="flex gap-2.5 whitespace-pre-wrap break-all">
              <span className={`shrink-0 select-none ${GLYPH_COLOR[typingLine.kind]}`}>
                {PROMPTS[typingLine.kind].glyph}
              </span>
              <span className={PROMPTS[typingLine.kind].className}>
                {typed}
                <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] animate-pulse bg-emerald-300" />
              </span>
            </div>
          )}
          {!typingLine && !reduced.current && (
            <div className="flex gap-2.5">
              <span className="shrink-0 select-none text-emerald-400">$</span>
              <span className="inline-block h-4 w-[7px] translate-y-[3px] animate-pulse bg-emerald-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
