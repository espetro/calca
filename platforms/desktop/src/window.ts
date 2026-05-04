import { platform } from "process";

import { getLogger } from "@logtape/logtape";
import { BrowserWindow, BrowserView, ContextMenu } from "electrobun/bun";

import type { CalcaRPCSchema, ContextMenuParams } from "./shared/types";
import { updaterHandlers } from "./updater";

type ContextMenuItem =
  | { label: string; role?: string; action?: string; enabled?: boolean }
  | { type: "separator" };

const log = getLogger(["calca", "desktop", "window"]);

let mainWindow: BrowserWindow | null = null;

function buildContextMenuItems(params: ContextMenuParams): ContextMenuItem[] {
  const { selectedCount, hasClipboardContent, totalFrames } = params;
  const hasSelection = selectedCount > 0;
  const isMac = platform === "darwin";
  const items: ContextMenuItem[] = [];

  if (isMac) {
    items.push({ label: "Undo", role: "undo", enabled: true });
    items.push({ label: "Redo", role: "redo", enabled: true });
  }

  items.push({ label: "Cut", role: "cut", enabled: hasSelection });
  items.push({ label: "Copy", role: "copy", enabled: hasSelection });
  if (selectedCount === 1) {
    items.push({ label: "Duplicate", action: "duplicate-frame", enabled: true });
  }
  items.push({ label: "Paste", role: "paste", enabled: hasClipboardContent });
  items.push({ type: "separator" });
  items.push({ label: "Export as PNG", enabled: hasSelection });
  items.push({ label: "Export as JPG", enabled: hasSelection });
  items.push({ label: "Export as SVG", enabled: hasSelection });
  items.push({ label: "Copy as Image", enabled: hasSelection });
  items.push({ type: "separator" });
  items.push({ label: "Select All", role: "selectAll", enabled: totalFrames > 0 });

  return items;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createWindow(url: string): void {
  const rpc = BrowserView.defineRPC<CalcaRPCSchema>({
    handlers: {
      requests: {
        ...updaterHandlers,
        contextMenu__show: async (params: ContextMenuParams) => {
          log.debug`Showing context menu with selectedCount=${params.selectedCount} totalFrames=${params.totalFrames}`;
          const items = buildContextMenuItems(params);
          ContextMenu.showContextMenu(items);
          return { action: "selectAll" };
        },
      },
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

  // Fallback: native can't read Jotai state, so all items are grayed out.
  // The web layer wires up contextMenu__show RPC to pass real state.
  mainWindow.on("context-menu", () => {
    ContextMenu.showContextMenu(
      buildContextMenuItems({
        selectedCount: 0,
        hasClipboardContent: false,
        totalFrames: 0,
      }),
    );
  });

  ContextMenu.on("context-menu-clicked", (event: unknown) => {
    const action = (event as { action?: string }).action;
    if (action === "duplicate-frame" && mainWindow) {
      mainWindow.evaluate("window.__duplicate?.()");
    }
  });

  log.info`Window created`;
}
