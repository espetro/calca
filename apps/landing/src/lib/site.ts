export const LINKS = {
  app: "/app/",
  github: "https://github.com/espetro/calca",
  macosDmg:
    "https://github.com/espetro/calca/releases/latest/download/stable-macos-arm64-Calca.dmg",
  windowsZip:
    "https://github.com/espetro/calca/releases/latest/download/stable-win-x64-Calca-Setup.zip",
  linuxTarGz:
    "https://github.com/espetro/calca/releases/latest/download/stable-linux-x64-Calca-Setup.tar.gz",
  roadmap: "https://github.com/users/espetro/projects/6",
  docs: "/docs/",
  docsMcp: "/docs/mcp/",
  feedback: "https://github.com/espetro/calca/discussions/5",
  polar: "https://buy.polar.sh/polar_cl_Mv1gdlG7bw3I70EC9IHtfeSHJj4PEKvA7JAUz23CFhj",
} as const;

export interface SamplePrompt {
  prompt: string;
  preset: "uiux" | "marketing" | "brand" | "presentation";
  format: string;
}

/** Verbatim prompts shown on the landing page and deep-linked into the demo. */
export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    prompt:
      "A landing page for a sourdough bakery — warm hero with a tagline, a three-item bread menu with prices, a short story section, and a footer with hours and address.",
    preset: "marketing",
    format: "Web page",
  },
  {
    prompt:
      "A fleet-tracking dashboard with a dark sidebar, four KPI cards, a route-status table, and a small map panel.",
    preset: "uiux",
    format: "App UI",
  },
  {
    prompt:
      "A 1200x628 launch announcement card for a minimal note-taking app called Jot — bold headline, one screenshot mockup, release date.",
    preset: "brand",
    format: "Brand card",
  },
  {
    prompt:
      "A pitch-deck cover slide for a warehouse-robotics startup — big title, one-line thesis, team row, and a contact footer.",
    preset: "presentation",
    format: "Deck slide",
  },
];

export function appLink(sample?: SamplePrompt): string {
  if (!sample) return LINKS.app;
  const params = new URLSearchParams({
    prompt: sample.prompt,
    preset: sample.preset,
  });
  return `${LINKS.app}?${params.toString()}`;
}
