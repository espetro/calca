import { execSync } from 'child_process';

export function ab(cmd: string): string {
  const stdout = execSync(`agent-browser ${cmd}`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return stdout;
}

export function snapshot(): string {
  return ab('snapshot -i');
}

export function findRef(snap: string, label: string): string {
  const regex = new RegExp(`label="${escapeRegex(label)}".*\\[ref=(\\w+)\\]`);
  const match = snap.match(regex);
  if (!match) {
    throw new Error(`Could not find ref for label "${label}" in snapshot`);
  }
  return `@${match[1]}`;
}

export function assertContains(snap: string, text: string): void {
  if (!snap.includes(text)) {
    throw new Error(`Expected snapshot to contain "${text}"`);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
