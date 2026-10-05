import { FiArrowRight } from "react-icons/fi";

import { LINKS } from "../lib/site";

interface Pkg {
  name: string;
  role: string;
}

const PACKAGES: Pkg[] = [
  { name: "@calca/canvas-base", role: "document model + commands" },
  { name: "@calca/canvas-ui", role: "headless canvas components" },
  { name: "@calca/canvas-flow", role: "React Flow adapter" },
  { name: "@calca/mcp-core", role: "MCP tool surface" },
  { name: "@calca/mcp", role: "calca CLI + stdio server" },
  { name: "@calca/agent-core", role: "BYOK agent seam" },
];

export default function OpenLayer() {
  return (
    <section id="open-layer" className="mx-auto max-w-6xl px-4 py-24">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
            A canvas your agents
            <br />
            can drive.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Calca ships as open-source npm packages, not just an app. The document model, the React
            Flow adapter, the MCP tool surface, and the agent seam are all yours to build on. Make
            your own surface, or hand Claude, Cursor, or Codex a board file and let it arrange,
            comment, and propose.
          </p>
          <a
            href={LINKS.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            Read the docs
            <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

        <div className="reveal">
          {/* double-bezel code card */}
          <div className="rounded-2xl bg-frame p-1.5">
            <div className="rounded-xl border border-border/70 bg-card p-5">
              <pre className="overflow-x-auto font-mono text-[13px] leading-loose text-foreground/90">
                <code>{`npm i @calca/canvas-flow

npx @calca/mcp install claude-code
calca open board.json`}</code>
              </pre>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
            {PACKAGES.map((pkg) => (
              <li key={pkg.name} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-foreground">{pkg.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{pkg.role}</p>
                </div>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-medium text-foreground">@calca/app</p>
                <p className="truncate text-xs text-muted-foreground">
                  the Calca app itself, web + desktop
                </p>
              </div>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Every package above is open source.</p>
        </div>
      </div>
    </section>
  );
}
