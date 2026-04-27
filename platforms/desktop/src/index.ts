// @ts-nocheck - Electrobun types have issues, but the API works at runtime
// STUB: Full implementation coming in T3 (server embedding)
import { BrowserWindow, ApplicationMenu } from "electrobun/bun";

const MIN_WIDTH = 1136;
const MIN_HEIGHT = 428;

const isDev = process.env.NODE_ENV !== "production";

ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ role: "quit" }],
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
]);

const _win = new BrowserWindow({
  title: "Calca",
  frame: { x: 0, y: 0, width: 1280, height: 800 },
  url: isDev ? "http://localhost:3000" : "http://127.0.0.1:3001",
});

_win.on("resize", (event) => {
  const { width, height } = event.data;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    _win.setSize(Math.max(width, MIN_WIDTH), Math.max(height, MIN_HEIGHT));
  }
});
