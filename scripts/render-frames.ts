/**
 * Render each frames-out/*.html to apps/landing/public/gallery/*.png.
 * Fills the generated `data-placeholder` image slots with real
 * keyword-matched photos (Openverse), approximating the end state the
 * app's images step produces, then screenshots via headless Chrome at
 * the frame's declared size.
 * Not committed — run locally after gen-frames.ts.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const IN = "frames-out";
const OUT = "apps/landing/public/gallery";
mkdirSync(OUT, { recursive: true });

const PLACEHOLDER_RE =
  /<div([^>]*data-placeholder[^>]*data-img-query="([^"]*)"[^>]*)>([\s\S]*?)<\/div>/g;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

/** Collect unique image queries across all generated frames. */
function collectQueries(files: string[]): Set<string> {
  const queries = new Set<string>();
  for (const f of files) {
    const html = readFileSync(`${IN}/${f}`, "utf8");
    for (const m of html.matchAll(PLACEHOLDER_RE)) queries.add(m[2]);
  }
  return queries;
}

/** Resolve one query to a photo URL via Openverse; picsum seed as fallback.
 *  Retries with progressively shorter queries — trailing style words like
 *  "warm lighting" often return zero hits. */
async function resolveImage(query: string): Promise<string> {
  const words = query.replace(/[^\w\s-]/g, " ").trim().split(/\s+/);
  for (let n = Math.min(words.length, 5); n >= 2; n--) {
    try {
      const q = encodeURIComponent(words.slice(0, n).join(" "));
      const res = await fetch(
        `https://api.openverse.org/v1/images/?q=${q}&page_size=5&fields=url,thumbnail,width,height`,
        {
          signal: AbortSignal.timeout(15000),
          headers: { "User-Agent": "calca-landing/1.0" },
        },
      );
      const data = await res.json();
      const hit = (data.results ?? []).find((r: { url?: string }) => r.url);
      if (hit?.url) return hit.url;
    } catch {
      /* try shorter */
    }
  }
  return `https://picsum.photos/seed/${slug(query)}/800/500`;
}

function fillPlaceholders(html: string, images: Map<string, string>): string {
  return html.replace(
    PLACEHOLDER_RE,
    (match, attrs, query) => {
      const w = /data-ph-w="(\d+)"/.exec(attrs)?.[1] ?? "600";
      const h = /data-ph-h="(\d+)"/.exec(attrs)?.[1] ?? "400";
      const src = images.get(query) ?? `https://picsum.photos/seed/${slug(query)}/${w}/${h}`;
      return `<div${attrs}><img src="${src}" alt="${query}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`;
    },
  );
}

const files = readdirSync(IN).filter((f) => f.endsWith(".html") && !f.startsWith("."));
const queries = [...collectQueries(files)];
console.log(`resolving ${queries.length} image queries…`);
const images = new Map<string, string>();
await Promise.all(
  queries.map(async (q) => {
    images.set(q, await resolveImage(q));
  }),
);

for (const file of files) {
  const name = file.replace(/\.html$/, "");
  const metaPath = `${IN}/${name}.meta.json`;
  let w = 1280;
  let h = 900;
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    w = meta.width || w;
    h = meta.height || h;
  }
  if (w > 1600) {
    h = Math.round((h * 1600) / w);
    w = 1600;
  }
  if (h > 1200) {
    w = Math.round((w * 1200) / h);
    h = 1200;
  }
  const filled = `${IN}/.${name}.filled.html`;
  const inner = fillPlaceholders(readFileSync(`${IN}/${file}`, "utf8"), images);
  // Mirror the app's DesignFrame srcdoc: Tailwind CDN + normalize styles.
  const doc = `<!DOCTYPE html>
<html style="height:auto;overflow:hidden;"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: hidden; }
    body { background: white; width: ${w}px; }
    #calca-measure { width: ${w}px; overflow: hidden; }
    img, video, svg { max-width: 100%; height: auto; display: block; object-fit: cover; }
    * { animation: none !important; transition: none !important; }
    [style*="100vh"], [style*="min-height: 100vh"], [style*="height: 100vh"] { height: auto !important; min-height: 0 !important; }
  </style>
</head><body><div id="calca-measure">${inner}</div></body></html>`;
  writeFileSync(filled, doc);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      `--screenshot=${OUT}/${name}.png`,
      `--window-size=${w},${h}`,
      "--hide-scrollbars",
      "--virtual-time-budget=20000",
      `file://${process.cwd()}/${filled}`,
    ],
    { stdio: "ignore" },
  );
  console.log(`${name}.png ${w}x${h}`);
}
