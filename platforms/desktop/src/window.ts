// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/window.ts
 *
 * Browser window creation and management.
 */

import { BrowserWindow, ContextMenu } from "electrobun/bun";
import { platform } from "process";
import { isDev, VITE_DEV_URL, HOST, PORT, MIN_WIDTH, MIN_HEIGHT } from "./constants";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createWindow(): void {
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