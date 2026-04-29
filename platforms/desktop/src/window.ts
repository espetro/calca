// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/window.ts
 *
 * Browser window creation and management.
 */

import { BrowserWindow, ContextMenu } from "electrobun/bun";
import { platform } from "process";
import { isDev, VITE_DEV_URL, MIN_WIDTH, MIN_HEIGHT } from "./constants";
import { setupUpdaterRPC } from "./webview/rpc";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

const SPLASH_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1a1a2e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
    }
    .splash {
      text-align: center;
    }
    .splash h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .splash p {
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="splash">
    <h1>Loading Calca...</h1>
    <p>Starting the design tool</p>
  </div>
</body>
</html>`;

export function createWindow(): void {
  if (isDev) {
    // Dev mode: connect directly to Vite dev server
    console.log(`[desktop] Opening window at ${VITE_DEV_URL}`);

    mainWindow = new BrowserWindow({
      title: "Calca",
      width: 1280,
      height: 800,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      url: VITE_DEV_URL,
    });

    setupUpdaterRPC(mainWindow.webview);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

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
  } else {
    // Production mode: show instant splash, load content via views://
    console.log("[desktop] Creating splash window");

    mainWindow = new BrowserWindow({
      title: "Calca",
      width: 1280,
      height: 800,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      html: SPLASH_HTML,
      hidden: true,
    });

    setupUpdaterRPC(mainWindow.webview);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    mainWindow.on("page-title-updated", (event) => {
      event.preventDefault();
    });

    console.log("[desktop] Splash window created");

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
}

export function loadMainContent(window: BrowserWindow): void {
  console.time("views-load");
  console.log("[desktop] Loading main content via views://");

  window.webview.loadURL("views://index.html").then(() => {
    console.timeEnd("views-load");
    window.show();
    console.log("[desktop] Main content loaded and window shown");
  }).catch((err) => {
    console.timeEnd("views-load");
    console.error("[desktop] Failed to load main content:", err);
  });
}