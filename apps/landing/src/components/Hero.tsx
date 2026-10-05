import { FaGithub, FaApple, FaWindows } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

import { LINKS } from "../lib/site";

interface CollageFrame {
  src: string;
  alt: string;
  label: string;
  className: string;
  rotate: string;
  delay: string;
}

const COLLAGE: CollageFrame[] = [
  {
    src: "/gallery/web-bakery.png",
    alt: "Generated landing page for a sourdough bakery",
    label: "web page",
    className: "left-0 top-10 w-[300px] lg:w-[340px]",
    rotate: "-4deg",
    delay: "0s",
  },
  {
    src: "/gallery/dashboard-fleet.png",
    alt: "Generated fleet-tracking dashboard UI",
    label: "app ui",
    className: "right-0 top-0 w-[300px] lg:w-[360px]",
    rotate: "3deg",
    delay: "1.2s",
  },
  {
    src: "/gallery/brand-launch.png",
    alt: "Generated launch announcement card",
    label: "brand card",
    className: "left-[18%] bottom-0 w-[260px] lg:w-[300px]",
    rotate: "2.5deg",
    delay: "2.1s",
  },
  {
    src: "/gallery/deck-robotics.png",
    alt: "Generated pitch-deck cover slide",
    label: "deck slide",
    className: "right-[14%] bottom-6 w-[280px] lg:w-[330px]",
    rotate: "-2.5deg",
    delay: "0.6s",
  },
];

function FrameCard({ frame }: { frame: CollageFrame }) {
  return (
    <figure
      className={`frame-drift absolute ${frame.className}`}
      style={
        {
          "--frame-rotate": frame.rotate,
          animationDelay: frame.delay,
        } as React.CSSProperties
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_18px_50px_-20px_hsl(252_10%_13%/0.35)]">
        <img src={frame.src} alt={frame.alt} className="block w-full" loading="eager" />
      </div>
      <figcaption className="mt-2 flex items-center gap-1.5 pl-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-[2px] bg-primary" />
        {frame.label}
      </figcaption>
    </figure>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* canvas dot grid, faded toward the edges */}
      <div aria-hidden="true" className="canvas-dots canvas-dots-fade absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Open source · BYOK · Web + desktop
          </p>

          <h1 className="mt-6 font-display text-[2.9rem] font-bold leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-[4.6rem]">
            One open canvas.
            <br />
            Every format.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Describe a page, a prototype, a brand board. Get live variations as movable frames.
            Remix, export, or let your agent drive.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={LINKS.app}
              className="group inline-flex items-center gap-2 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-base font-semibold text-primary-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              Try the web demo
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-200 group-hover:translate-x-0.5">
                <FiArrowRight className="h-4.5 w-4.5" />
              </span>
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-secondary"
            >
              <FaGithub className="h-4.5 w-4.5" />
              Star on GitHub
            </a>
          </div>

          <p className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            or download for
            <a
              href={LINKS.macosDmg}
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              <FaApple className="h-3.5 w-3.5" /> macOS
            </a>
            <a
              href={LINKS.windowsZip}
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              <FaWindows className="h-3.5 w-3.5" /> Windows
            </a>
          </p>
        </div>

        {/* generated frames scattered on the canvas */}
        <div className="relative mx-auto mt-4 hidden h-[430px] max-w-4xl md:block lg:h-[470px]">
          {COLLAGE.map((frame) => (
            <FrameCard key={frame.src} frame={frame} />
          ))}
        </div>

        {/* mobile: two-column static wall */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 md:hidden">
          {COLLAGE.slice(0, 2).map((frame) => (
            <figure key={frame.src}>
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_12px_32px_-16px_hsl(252_10%_13%/0.35)]">
                <img src={frame.src} alt={frame.alt} className="block w-full" loading="eager" />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
