import { execSync } from "child_process";

export function ab(cmd: string): string {
  const stdout = execSync(`agent-browser ${cmd}`, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return stdout;
}

export function snapshot(): string {
  return ab("snapshot -i");
}

export function snapshotAll(): string {
  return ab("snapshot");
}

export function findRef(snap: string, label: string): string {
  // agent-browser snapshot format: `- role "Name" [ref=e12]` — match quoted
  // accessible name followed by a ref on the same line. Exact match first,
  // then substring — "Prompt" must not hit the hidden "System Prompt" field.
  const lines = snap.split("\n");
  const needle = label.toLowerCase();
  let partial: string | null = null;
  for (const line of lines) {
    const m = line.match(/"([^"]+)"/);
    if (!m) continue;
    const name = m[1].toLowerCase();
    const ref = line.match(/ref=(\w+)/);
    if (!ref) continue;
    if (name === needle) return `@${ref[1]}`;
    if (partial === null && name.includes(needle)) partial = `@${ref[1]}`;
  }
  if (partial) return partial;
  throw new Error(`Could not find ref for label "${label}" in snapshot`);
}

export function assertContains(snap: string, text: string): void {
  if (!snap.includes(text)) {
    throw new Error(`Expected snapshot to contain "${text}"`);
  }
}

/**
 * Joins a spec-relative path onto E2E_BASE_URL, which may itself carry a base
 * path (`http://localhost:8899/app/` in SW mode). "/" alone means the app root.
 */
export function appUrl(path: string): string {
  const base = (process.env.E2E_BASE_URL ?? "http://localhost:5173").replace(/\/*$/, "/");
  if (path.startsWith("http")) return path;
  return base + path.replace(/^\/+/, "");
}

export function evalJs(expr: string): string {
  // Design nodes render in sandboxed iframes; once one mounts, agent-browser's
  // eval context can land inside it (about:blank, opaque origin) where DOM and
  // localStorage access silently return null or throw SecurityError.
  ab("frame main");
  return ab(`eval "${expr.replace(/"/g, '\\"')}"`).trim();
}

/**
 * agent-browser's `console`/`errors` buffers survive navigations — entries
 * from a previous spec's page leak into the next load's "clean console"
 * assertions. Clear them right before an Open.
 */
export function clearPageDiagnostics(): void {
  try {
    ab("console --clear");
  } catch {
    // older agent-browser without --clear — page buffers just persist
  }
  try {
    ab("errors --clear");
  } catch {
    // same
  }
}
