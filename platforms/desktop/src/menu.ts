// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/menu.ts
 *
 * Application menu setup.
 */

import { ApplicationMenu } from "electrobun/bun";
import { versionInfo } from "./version";
import { getMainWindow } from "./window";

export function setupApplicationMenu(): void {
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
            const mainWindow = getMainWindow();
            if (mainWindow) {
              mainWindow.evaluate("window.__openFeedback?.()");
            }
          },
        },
        { type: "separator" },
        {
          label: "About Calca",
          click: () => {
            const mainWindow = getMainWindow();
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
}