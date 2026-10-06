import { FiArrowRight, FiBookOpen } from "react-icons/fi";

import { LINKS } from "../lib/site";
import Terminal from "./Terminal";

const HOSTS = ["claude-code", "cursor", "gemini-cli", "opencode", "codex"];

export default function OpenLayer() {
  return (
    <section id="open-layer" className="mx-auto max-w-6xl px-4 py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
            A canvas your agents
            <br />
            can drive.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            The calca CLI ships the canvas as MCP tools. One install and your agent can read a
            board, stage edits under a lease, and rearrange frames — no screenshots, no copy-paste.
            Open source, every layer.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {HOSTS.map((host) => (
              <span
                key={host}
                className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {host}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={LINKS.docsMcp}
              className="group inline-flex items-center gap-2 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-base font-semibold text-primary-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              Set up your agent
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-200 group-hover:translate-x-0.5">
                <FiArrowRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href={LINKS.docs}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-secondary"
            >
              <FiBookOpen className="h-4 w-4" />
              All docs
            </a>
          </div>
        </div>

        <div className="reveal">
          <Terminal />
          <p className="mt-3 text-xs text-muted-foreground">
            One command to install, then your agent works the board directly.
          </p>
        </div>
      </div>
    </section>
  );
}
