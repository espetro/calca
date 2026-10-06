/**
 * Runs the Gauge e2e suite against the production-style "service worker" API
 * runtime (issue #74): builds `apps/landing/dist` (`app/` + `sw.js`), serves
 * it like a plain static host, and points the suite at
 * `http://localhost:<port>/app/` with `E2E_API_MODE=sw`.
 *
 * Usage:
 *   bun run test:e2e:sw                      # full suite (incl. `sw` specs)
 *   bun scripts/e2e-sw.ts e2e/benchmarks     # benchmark specs only
 *   bun scripts/e2e-sw.ts e2e/specs/sw-runtime.md
 *   E2E_SW_SKIP_BUILD=1 bun run test:e2e:sw  # reuse an existing dist
 *   E2E_SW_PORT=9000 bun run test:e2e:sw     # override the static port
 *
 * Provider credentials for generation specs resolve (first hit wins):
 * VITE_AI_* -> E2E_AI_* -> CAUCE_AI_* -> AI_*_PAID. VITE_* vars must be
 * present at BUILD time — they are baked into the bundle by vite `define`.
 */
import { cpSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, normalize, resolve, sep } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const DIST_ROOT = join(REPO_ROOT, "apps/landing/dist");
const PORT = Number(process.env.E2E_SW_PORT ?? 8899);
const BASE_URL = `http://localhost:${PORT}/app/`;

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const contentType = (path: string): string => {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME_TYPES[ext] ?? "application/octet-stream";
};

/** Resolve AI provider creds once and reuse for the build AND the gauge env. */
const resolvedEnv = (): Record<string, string> => {
  const env = { ...process.env } as Record<string, string>;
  env.VITE_AI_BASE_URL ??= env.E2E_AI_BASE_URL ?? env.CAUCE_AI_BASE_URL ?? env.AI_BASE_URL_PAID;
  env.VITE_AI_API_KEY ??= env.E2E_AI_API_KEY ?? env.CAUCE_AI_API_KEY ?? env.AI_API_KEY_PAID;
  env.VITE_AI_MODEL ??= env.E2E_AI_MODEL ?? env.CAUCE_AI_MODEL ?? env.AI_MODEL_ID_PAID;
  // Same resolution for step code (provider seeding), under stable names.
  env.E2E_AI_BASE_URL ??= env.VITE_AI_BASE_URL;
  env.E2E_AI_API_KEY ??= env.VITE_AI_API_KEY;
  env.E2E_AI_MODEL ??= env.VITE_AI_MODEL;
  return env;
};

const buildDist = async (env: Record<string, string>) => {
  mkdirSync(DIST_ROOT, { recursive: true });
  // The suite doesn't exercise landing/docs pages; seed public/ so the dist
  // has the site's root assets (favicon, fonts) like a real deploy instead of
  // 404ing them into console errors.
  const publicDir = join(REPO_ROOT, "apps/landing/public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, DIST_ROOT, { recursive: true });
  }
  const proc = Bun.spawn(["bun", "run", "build:app"], {
    cwd: REPO_ROOT,
    env,
    stdio: ["inherit", "inherit", "inherit"],
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`bun run build:app failed with exit code ${code}`);
  }
};

/**
 * Static-host semantics: files and directory index.html only — no SPA
 * fallback — so `/api/*` and `/health` 404 like a real static host whenever
 * the service worker is not intercepting them.
 */
const serveDist = () =>
  Bun.serve({
    port: PORT,
    fetch(req) {
      const pathname = decodeURIComponent(new URL(req.url).pathname);
      const filePath = normalize(join(DIST_ROOT, pathname));
      if (filePath !== DIST_ROOT && !filePath.startsWith(DIST_ROOT + sep)) {
        return new Response("Forbidden", { status: 403 });
      }
      let candidate = filePath;
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        candidate = join(candidate, "index.html");
      }
      if (!existsSync(candidate) || !statSync(candidate).isFile()) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(Bun.file(candidate), {
        headers: { "Content-Type": contentType(candidate) },
      });
    },
  });

const waitForServer = async () => {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await Bun.sleep(100);
  }
  throw new Error(`static server did not come up on ${BASE_URL}`);
};

const main = async () => {
  const env = resolvedEnv();

  if (process.env.E2E_SW_SKIP_BUILD) {
    console.log(`e2e-sw: E2E_SW_SKIP_BUILD set — reusing ${DIST_ROOT}`);
  } else {
    console.log("e2e-sw: building app bundle + service worker (bun run build:app)");
    await buildDist(env);
  }

  for (const required of [join(DIST_ROOT, "sw.js"), join(DIST_ROOT, "app", "index.html")]) {
    if (!existsSync(required)) {
      throw new Error(`missing ${required} — run again without E2E_SW_SKIP_BUILD`);
    }
  }

  const server = serveDist();
  console.log(`e2e-sw: serving ${DIST_ROOT} at http://localhost:${PORT} (app at /app/)`);

  try {
    await waitForServer();
    const specs = process.argv.slice(2);
    const targets = specs.length > 0 ? specs : ["e2e/specs"];
    const gaugeBin = join(REPO_ROOT, "node_modules", ".bin", "gauge");
    const gauge = Bun.spawn([gaugeBin, "run", ...targets], {
      cwd: REPO_ROOT,
      env: {
        ...env,
        E2E_API_MODE: "sw",
        E2E_BASE_URL: BASE_URL,
        GAUGE_TS_PACKAGE_RUNNER: "bun",
        STEP_IMPL_DIR: "steps,support",
      },
      stdio: ["inherit", "inherit", "inherit"],
    });
    const code = await gauge.exited;
    console.log(`e2e-sw: gauge exited with code ${code}`);
    process.exit(code);
  } finally {
    server.stop(true);
  }
};

await main();
