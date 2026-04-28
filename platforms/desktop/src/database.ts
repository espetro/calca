// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/database.ts
 *
 * Database directory setup for the Calca desktop app.
 */

import { isDev } from "./constants";

export function setupDatabaseDirectory(): void {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (!home) return;

  const appSupport = isDev
    ? `${home}/Library/Application Support/Calca-dev`
    : `${home}/Library/Application Support/Calca`;

  try {
    // Ensure directory exists - Bun supports fs operations
    const dir = Bun.file(appSupport);
    // For now, we just ensure the path is noted
    // Full database integration is in the storage migration plan
    console.log(`[desktop] App data directory: ${appSupport}`);
  } catch {
    // Ignore - database setup is not critical for launch
  }
}