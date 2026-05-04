import React from "react";
import { FaMagic, FaLayerGroup, FaGithub, FaComments, FaRoad } from "react-icons/fa";

const FEEDBACK_DISCUSSION_URL = "https://github.com/espetro/calca/discussions/5";
const ROADMAP_URL = "https://github.com/users/espetro/projects/6";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <FaMagic className="h-5 w-5" />,
    title: "AI Design Generation",
    description:
      "Describe your vision in plain English and get multiple polished HTML/CSS variations instantly.",
  },
  {
    icon: <FaLayerGroup className="h-5 w-5" />,
    title: "Infinite Canvas",
    description: "Organize, compare, and iterate on design concepts without constraints.",
  },
  {
    icon: <FaGithub className="h-5 w-5" />,
    title: "Open Source",
    description: "Open-source under AGPL-3.0. Download it or contribute to the project.",
  },
  {
    icon: <FaComments className="h-5 w-5" />,
    title: "Feedback & Sharing",
    description: "Share ideas, request features, and collaborate with the community.",
  },
];

export default function Features() {
  return (
    <section className="mx-auto mt-16 w-[95%] max-w-[1000px] px-4 sm:mt-20">
      <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Features</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-all hover:bg-card"
          >
            <div className="mb-3 flex items-center gap-3 text-primary">
              {f.icon}
              <h3 className="font-semibold">{f.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={ROADMAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:bg-secondary"
        >
          <FaRoad className="h-4 w-4" />
          View Roadmap
        </a>
        <a
          href={FEEDBACK_DISCUSSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:bg-secondary"
        >
          <FaComments className="h-4 w-4" />
          Share Your Ideas
        </a>
      </div>
    </section>
  );
}
