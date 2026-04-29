/**
 * platforms/desktop/src/menu.ts
 *
 * Application menu setup.
 */

import { ApplicationMenu } from "electrobun/bun";

export function setupApplicationMenu(): void {
  // ApplicationMenu.on("open-feedback-dialog", (event) => {
  //   // Open feedback modal via IPC to webview
  //   const mainWindow = getMainWindow();
  //   if (mainWindow) {
  //     mainWindow.evaluate("window.__openFeedback?.()");
  //   }
  // });

  // ApplicationMenu.on("open-about-dialog", (event) => {
  //   const mainWindow = getMainWindow();
  //   if (mainWindow) {
  //     // TODO Show "About" section in Settings dialog
  //     mainWindow.evaluate(`
  //               alert('Calca v${versionInfo.version}\\nAn AI design tool for the desktop.');
  //             `);
  //   }
  // });

  ApplicationMenu.setApplicationMenu([
    {
      label: "Calca",
      submenu: [
        //
        { role: "about" },
        { type: "separator" },
        { role: "settings" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        //
        { role: "find" },
      ],
    },
    {
      label: "View",
      submenu: [
        //
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Report a Bug...",
          action: "open-feedback-dialog",
        },
        { type: "separator" },
        {
          label: "About Calca",
          action: "open-about-dialog",
        },
      ],
    },
  ]);
}
