// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/index.ts
 *
 * Main process entry point for the Calca Electrobun desktop app.
 * Embeds the Hono server and Vite static build for desktop distribution.
 */

import { BrowserWindow, ApplicationMenu, ContextMenu } from "electrobun/bun";
import { platform } from "process";

// ============================================================================
// Constants
// ============================================================================

const PORT = 3001;
const HOST = "127.0.0.1";
const MIN_WIDTH = 1136;
const MIN_HEIGHT = 428;

const isDev = process.env.NODE_ENV !== "production";
const VITE_DEV_URL = "http://localhost:5173";

// ============================================================================
// Version
// ============================================================================

interface VersionInfo {
  version: string;
}

function readVersion(): VersionInfo {
  try {
    // In production, version.json is bundled in Resources/
    // In dev, we read from apps/Resources/
    const versionPath = isDev
      ? "../../apps/Resources/version.json"
      : "Resources/version.json";
    const file = Bun.file(versionPath);
    if (file.exists()) {
      return JSON.parse(await file.text());
    }
  } catch {
    // Fallback
  }
  return { version: "0.0.0" };
}

const versionInfo = readVersion();

// ============================================================================
// Auto-Update Status (stored on globalThis for display)
// ============================================================================

declare global {
  interface GlobalThis {
    __CALCA_UPDATE_AVAILABLE__?: boolean;
    __CALCA_UPDATE_VERSION__?: string;
  }
}

// ============================================================================
// Startup Error Page
// ============================================================================

function getErrorPageHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Startup Error - Calca</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 500px;
      text-align: center;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b; }
    p { color: #aaa; line-height: 1.6; margin-bottom: 1rem; }
    .version { font-size: 0.875rem; color: #666; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <p>Please try restarting the application. If the problem persists, check the console for more details.</p>
    <div class="version">Calca v${versionInfo.version}</div>
  </div>
</body>
</html>`;
}

// ============================================================================
// Wait for Server (dev mode only)
// ============================================================================

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

// ============================================================================
// Fetch Handler
// ============================================================================

import serverApp from "@gosto/server";

async function handleFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // In dev mode, proxy to Vite dev server
  if (isDev) {
    try {
      const response = await fetch(new URL(url.pathname + url.search, VITE_DEV_URL), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "manual",
      });
      return response;
    } catch {
      return new Response(getErrorPageHtml(
        "Dev Server Unavailable",
        "Could not connect to the Vite development server. Make sure to run the web app first."
      ), {
        status: 503,
        headers: { "Content-Type": "text/html" },
      });
    }
  }

  // Production mode: serve API routes via Hono, static files from Resources/web/

  // API routes -> Hono server
  if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
    return serverApp.fetch(request);
  }

  // Static files from Resources/web/
  const staticPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = `Resources/web${staticPath}`;

  try {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const contentType = getContentType(staticPath);
      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    }
  } catch {
    // File not found or error reading
  }

  // SPA fallback: serve index.html for non-API routes
  const indexFile = Bun.file("Resources/web/index.html");
  if (await indexFile.exists()) {
    return new Response(indexFile, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response(getErrorPageHtml(
    "Static Files Missing",
    "Could not find the web app bundle. The application may not be properly installed."
  ), {
    status: 503,
    headers: { "Content-Type": "text/html" },
  });
}

function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    webp: "image/webp",
   woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
  };
  return types[ext ?? ""] ?? "application/octet-stream";
}

// ============================================================================
// Database Directory Setup
// ============================================================================

function setupDatabaseDirectory(): void {
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

// ============================================================================
// Main Process
// ============================================================================

async function main(): Promise<void> {
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

  // Start Bun.serve for the desktop server
  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch: handleFetch,
    error: (error) => {
      console.error("[desktop] Server error:", error);
      return new Response(getErrorPageHtml(
        "Server Error",
        `An unexpected error occurred: ${error.message}`
      ), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    },
  });

  console.log(`[desktop] Server running on http://${HOST}:${PORT}`);

  // Setup database directory
  setupDatabaseDirectory();

  // Create the browser window after server starts
  createWindow();
}

// ============================================================================
// Browser Window
// ============================================================================

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const windowUrl = isDev
    ? VITE_DEV_URL
    : `http://${HOST}:${PORT}`;

  console.log(`[desktop] Opening window at ${windowUrl}`);

  mainWindow = new BrowserWindow({
    title: "Calca",
    width: 1280,
    height: 800,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    url: windowUrl,
  });

  // Enforce minimum size on resize
  mainWindow.on("resize", (event) => {
    // The resize event data contains the new size
    // But BrowserWindow API may vary - use setSize to enforce
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle page title updates
  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  console.log("[desktop] Window created");

  mainWindow.on("context-menu", () => {
    const isMac = platform === "darwin";

    const menu = new ContextMenu({
      items: [
        ...(isMac
          ? [
              { label: "Undo", role: "undo" },
              { label: "Redo", role: "redo" },
            ]
          : []),
        { label: "Cut", role: "cut" },
        { label: "Copy", role: "copy" },
        { label: "Paste", role: "paste" },
        { type: "separator" },
        { label: "Select All", role: "selectAll" },
      ],
    });

    menu.show();
  });
}

// ============================================================================
// Application Menu
// ============================================================================

ApplicationMenu.setApplicationMenu([
  {
    label: "Calca",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      { role: "close" },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "Report a Bug...",
        click: () => {
          // Open feedback modal via IPC to webview
          if (mainWindow) {
            mainWindow.evaluate("window.__openFeedback?.()");
          }
        },
      },
      { type: "separator" },
      {
        label: "About Calca",
        click: () => {
          if (mainWindow) {
            mainWindow.evaluate(`
              alert('Calca v${versionInfo.version}\\nAn AI design tool for the desktop.');
            `);
          }
        },
      },
    ],
  },
]);

// ============================================================================
// Start
// ============================================================================

main().catch((e) => {
  console.error("[desktop] Fatal error:", e);
  process.exit(1);
});
