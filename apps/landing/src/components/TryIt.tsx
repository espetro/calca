import { FiArrowRight, FiKey, FiLayers, FiZap } from "react-icons/fi";

import { SAMPLE_PROMPTS, appLink, LINKS } from "../lib/site";

const STEPS = [
  {
    icon: FiKey,
    title: "Paste a key",
    body: "Anthropic or any OpenAI-compatible endpoint. One field, done.",
  },
  {
    icon: FiLayers,
    title: "Pick a preset",
    body: "UI/UX, marketing, brand, deck, email. Or write your own system prompt.",
  },
  {
    icon: FiZap,
    title: "Generate",
    body: "Compare the takes side by side on one canvas. Remix the winner.",
  },
];

export default function TryIt() {
  return (
    <section id="try" className="border-y border-border/60 bg-frame/50">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <div className="reveal max-w-2xl">
          <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
            Start from a prompt,
            <br />
            not a blank page.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Bring your own key, pick a preset, generate. Nothing to install.
          </p>
        </div>

        {/* sample prompt chips — deep-linked into the demo */}
        <div className="reveal mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SAMPLE_PROMPTS.map((sample) => (
            <a
              key={sample.format}
              href={appLink(sample)}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-[2px] bg-primary" />
                  {sample.format}
                </span>
                <p className="mt-2 font-mono text-[13px] leading-relaxed text-foreground/90">
                  {sample.prompt}
                </p>
              </div>
              <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <FiArrowRight className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>

        {/* BYOK steps */}
        <div className="reveal mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <step.icon className="h-4.5 w-4.5" />
                </span>
                <p className="font-display text-lg font-semibold">
                  <span className="mr-2 font-mono text-sm text-muted-foreground">{i + 1}</span>
                  {step.title}
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="reveal mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Your key never leaves your browser. No account, no proxy, nothing stored server side.
          </p>
          <a
            href={LINKS.app}
            className="group inline-flex items-center gap-2 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-base font-semibold text-primary-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Open the demo
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-200 group-hover:translate-x-0.5">
              <FiArrowRight className="h-4.5 w-4.5" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
