// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/index.ts
 *
 * Main process entry point for the Calca Electrobun desktop app.
 * Embeds the Hono server and Vite static build for desktop distribution.
 */

import "./constants";
import { isDev, VITE_DEV_URL } from "./constants";
import { versionInfo } from "./version";
import { setupApplicationMenu } from "./menu";
import { waitForServer, startServer } from "./server";
import { setupDatabaseDirectory } from "./database";
import { createWindow, loadMainContent, getMainWindow } from "./window";
import { checkAndNotify } from "./updater";

// Auto-update status (stored on globalThis for display)
declare global {
  interface GlobalThis {
    __CALCA_UPDATE_AVAILABLE__?: boolean;
    __CALCA_UPDATE_VERSION__?: string;
  }
}

// ============================================================================
// Main Process
// ============================================================================

async function main(): Promise<void> {
  console.time("startup");
  console.log(`[desktop] Starting Calca v${versionInfo.version}`);
  console.log(`[desktop] Mode: ${isDev ? "development" : "production"}`);

  // In dev mode, wait for Vite dev server to be ready
  if (isDev) {
    console.log(`[desktop] Waiting for Vite dev server at ${VITE_DEV_URL}...`);
    try {
      await waitForServer(`${VITE_DEV_URL}/`, 60000);
      console.log("[desktop] Vite dev server ready");
    } catch (e) {
      console.error("[desktop] Vite dev server not available:", e);
    }
  }

  // Setup database directory
  setupDatabaseDirectory();

  // Setup application menu
  setupApplicationMenu();

  // Create the browser window (splash in prod, direct in dev)
  createWindow();

  // Check for updates on startup and every 60 minutes
  checkAndNotify();
  setInterval(checkAndNotify, 60 * 60 * 1000);

  if (isDev) {
    // Dev mode: window already has URL set, just start server
    startServer();
    console.log(`[desktop] Server running on http://127.0.0.1:3001`);
    console.timeEnd("startup");
  } else {
    // Production mode: show splash immediately, then start server and load content
    console.time("splash");
    const win = getMainWindow();
    if (win) {
      win.show();
      console.timeEnd("splash");
    }

    console.time("server");
    startServer();
    console.timeEnd("server");
    console.log(`[desktop] Server running on http://127.0.0.1:3001`);

    // Load main content via views:// protocol
    if (win) {
      loadMainContent(win);
    }
  }
}

// ============================================================================
// Start
// ============================================================================

main().catch((e) => {
  console.error("[desktop] Fatal error:", e);
  process.exit(1);
});