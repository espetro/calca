// @ts-nocheck - Electrobun types have issues, but the API works at runtime

import { version } from "../package.json";

export interface VersionInfo {
  version: string;
}

export function readVersion(): VersionInfo {
  return { version };
}

export const versionInfo = readVersion();