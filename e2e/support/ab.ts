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
