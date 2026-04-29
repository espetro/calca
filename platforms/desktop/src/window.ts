import { platform } from "process";

import { getLogger } from "@logtape/logtape";
import { BrowserWindow, BrowserView, ContextMenu } from "electrobun/bun";

import type { CalcaRPCSchema } from "./shared/types";
import { updaterHandlers } from "./updater";

const log = getLogger(["calca", "desktop", "window"]);

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createWindow(url: string): void {
  const rpc = BrowserView.defineRPC<CalcaRPCSchema>({
    handlers: {
      requests: updaterHandlers,
    },
  });

  log.info`Opening window at ${url}`;

  mainWindow = new BrowserWindow({
    title: "Calca",
    frame: {
      x: 100,
      y: 100,
      width: 1280,
      height: 800,
    },
    url,
    rpc,
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("page-title-updated", (event: unknown) => {
    if (event && typeof event === "object" && "preventDefault" in event) {
      (event as { preventDefault: () => void }).preventDefault();
    }
  });

  mainWindow.on("context-menu", () => {
    const isMac = platform === "darwin";

    ContextMenu.showContextMenu([
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
    ]);
  });

  log.info`Window created`;
}
