import type { CanvasSnapshot } from "./store";

export interface Migration {
  version: number;
  up(snapshot: CanvasSnapshot): CanvasSnapshot;
}

/**
 * Applies pending migrations in ascending version order. A snapshot whose
 * `version` is ahead of the newest known migration is rejected rather than
 * silently truncated.
 */
export const migrate = (snapshot: CanvasSnapshot, migrations: Migration[]): CanvasSnapshot => {
  const ordered = [...migrations].sort((a, b) => a.version - b.version);
  const latest = ordered.at(-1)?.version ?? snapshot.version;
  if (snapshot.version > latest) {
    throw new Error(
      `snapshot version ${snapshot.version} is newer than supported version ${latest}`,
    );
  }
  return ordered
    .filter((m) => m.version > snapshot.version)
    .reduce((snap, m) => m.up(snap), snapshot);
};
