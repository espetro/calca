// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/version.ts
 *
 * Version info reader for the Calca desktop app.
 */

import { isDev } from "./constants";

export interface VersionInfo {
  version: string;
}

export function readVersion(): VersionInfo {
  try {
    // In production, version.json is bundled in Resources/
    // In dev, we read from apps/Resources/
    const versionPath = isDev
      ? "../../apps/Resources/version.json"
      : "Resources/version.json";
    const text = require("fs").readFileSync(versionPath, "utf-8");
    return JSON.parse(text);
  } catch {
    // Fallback
  }
  return { version: "0.0.0" };
}

export const versionInfo = readVersion();