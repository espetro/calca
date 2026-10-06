/**
 * One-off asset generator for the landing page gallery.
 * Hits the local /api/workflow endpoint with the app's real presets and
 * writes the returned HTML frames to frames-out/*.html.
 * Not committed — run locally with the dev server up.
 */
import { SYSTEM_PROMPT_PRESETS } from "../apps/web/src/features/settings/lib/presets";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "frames-out";
mkdirSync(OUT, { recursive: true });

interface Job {
  file: string;
  preset: string;
  prompt: string;
}

const jobs: Job[] = [
  {
    file: "dashboard-fleet",
    preset: "uiux",
    prompt:
      "A fleet-tracking dashboard with a dark sidebar, four KPI cards, a route-status table, and a small map panel.",
  },
  {
    file: "brand-launch",
    preset: "brand",
    prompt:
      "A 1200x628 launch announcement card for a minimal note-taking app called Jot — bold headline, one screenshot mockup, release date.",
  },
  {
    file: "deck-robotics",
    preset: "presentation",
    prompt:
      "A pitch-deck cover slide for a warehouse-robotics startup — big title, one-line thesis, team row, and a contact footer.",
  },
];

const presetPrompt = (id: string) => SYSTEM_PROMPT_PRESETS.find((p) => p.id === id)!.prompt;

interface FrameOut {
  html?: string;
  label?: string;
  width?: number;
  height?: number;
}

async function generate(job: Job) {
  const body = {
    apiKey: process.env.AI_API_KEY_PAID ?? process.env.CAUCE_AI_API_KEY,
    baseURL: process.env.CAUCE_AI_BASE_URL,
    model: "google/gemini-2.5-flash",
    providerType: "openai-compatible",
    conceptCount: 2,
    mode: "quick",
    prompt: job.prompt,
    systemPrompt: presetPrompt(job.preset),
  };
  const res = await fetch("http://localhost:3001/api/workflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let frames: FrameOut[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith(":")) continue;
    const colon = t.indexOf(":");
    if (colon === -1) continue;
    try {
      const part = JSON.parse(t.slice(colon + 1));
      if (part.type === "data-workflow" && part.data) {
        const steps = part.data.steps as
          | Record<string, { status: string; output: unknown }>
          | undefined;
        const out = steps?.collectResults?.output as
          | { frames?: FrameOut[] }
          | undefined;
        if (out?.frames?.length) frames = out.frames;
      }
    } catch {
      /* partial lines */
    }
  }
  if (frames.length === 0) {
    console.log(`[${job.file}] NO FRAMES. tail:`, text.slice(-600));
    return;
  }
  frames.forEach((f, i) => {
    if (!f.html) return;
    const name = i === 0 ? job.file : `${job.file}-${i + 1}`;
    writeFileSync(`${OUT}/${name}.html`, f.html);
    writeFileSync(
      `${OUT}/${name}.meta.json`,
      JSON.stringify({ label: f.label, width: f.width, height: f.height }),
    );
  });
  console.log(`[${job.file}] wrote ${frames.length} frame(s)`);
}

for (const job of jobs) {
  console.log(`[${job.file}] generating…`);
  try {
    await generate(job);
  } catch (e) {
    console.log(`[${job.file}] FAILED`, e);
  }
}
console.log("done");
