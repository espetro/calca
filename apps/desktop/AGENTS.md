# apps/desktop/AGENTS.md — Desktop App Guidelines

> Guidelines for the Electrobun desktop wrapper. See root [AGENTS.md](../AGENTS.md) for universal rules.

---

## Architecture Overview

The desktop app wraps the web frontend using Electrobun, providing native OS integration.

```
apps/desktop/
├── src/
│   ├── windows/               # Window management
│   │   ├── main-window.ts
│   │   └── settings-window.ts
│   ├── ipc/                   # Inter-process communication
│   │   ├── handlers/
│   │   └── channels.ts
│   ├── menu/                  # Native menus
│   │   ├── app-menu.ts
│   │   └── context-menu.ts
│   ├── tray/                  # System tray
│   │   └── tray-icon.ts
│   └── index.ts              # Entry point
└── package.json
```

---

## Window Management

**Main window setup:**

```typescript
// windows/main-window.ts
import { Window } from "electrobun";

export function createMainWindow() {
  const mainWindow = new Window({
    title: "Gosto",
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: "./preload.js",
    },
  });

  // Load the web app
  mainWindow.loadURL("http://localhost:3000");

  return mainWindow;
}
```

**Settings window:**

```typescript
// windows/settings-window.ts
export function createSettingsWindow() {
  const settingsWindow = new Window({
    title: "Settings",
    width: 600,
    height: 500,
    resizable: false,
    webPreferences: {
      preload: "./preload.js",
    },
  });

  settingsWindow.loadURL("http://localhost:3000/settings");

  return settingsWindow;
}
```

---

## IPC Communication

**Main to renderer:**

```typescript
// ipc/channels.ts
export const IPC_CHANNELS = {
  MENU_ACTION: "menu-action",
  THEME_CHANGED: "theme-changed",
  UPDATE_AVAILABLE: "update-available",
} as const;
```

**IPC handlers:**

```typescript
// ipc/handlers/menu.ts
import { ipcMain } from "electrobun";

ipcMain.handle("menu-action", async (event, action) => {
  switch (action) {
    case "new-project":
      return createNewProject();
    case "export":
      return showExportDialog();
    case "settings":
      return openSettingsWindow();
    default:
      throw new Error(`Unknown menu action: ${action}`);
  }
});
```

**Renderer to main:**

```typescript
// Preload script (exposed to renderer)
import { contextBridge, ipcRenderer } from "electrobun";

contextBridge.exposeInMainWorld("electronAPI", {
  sendMenuAction: (action: string) => ipcRenderer.send("menu-action", action),
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on("theme-changed", (_, theme) => callback(theme));
  },
});
```

---

## Native Menus

**Application menu:**

```typescript
// menu/app-menu.ts
import { Menu } from "electrobun";

export function createAppMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: () => sendMenuAction("new-project"),
        },
        {
          label: "Open Project",
          accelerator: "CmdOrCtrl+O",
          click: () => sendMenuAction("open-project"),
        },
        { type: "separator" },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
          click: () => sendMenuAction("export"),
        },
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
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          click: () => sendMenuAction("zoom-in"),
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => sendMenuAction("zoom-out"),
        },
        {
          label: "Zoom to Fit",
          accelerator: "CmdOrCtrl+0",
          click: () => sendMenuAction("zoom-fit"),
        },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

---

## System Tray

**Tray icon setup:**

```typescript
// tray/tray-icon.ts
import { Tray, Menu } from "electrobun";
import path from "path";

export function createTrayIcon() {
  const tray = new Tray(path.join(__dirname, "assets", "tray-icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Gosto",
      click: () => showMainWindow(),
    },
    { type: "separator" },
    {
      label: "New Project",
      click: () => createNewProject(),
    },
    {
      label: "Recent Projects",
      submenu: getRecentProjects().map((project) => ({
        label: project.name,
        click: () => openProject(project.id),
      })),
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => openSettingsWindow(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => quitApp(),
    },
  ]);

  tray.setToolTip("Gosto");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    showMainWindow();
  });

  return tray;
}
```

---

## Native Features

**File dialogs:**

```typescript
import { dialog } from "electrobun";

export async function showExportDialog() {
  const result = await dialog.showSaveDialog({
    title: "Export Design",
    defaultPath: "design.html",
    filters: [
      { name: "HTML", extensions: ["html"] },
      { name: "SVG", extensions: ["svg"] },
      { name: "PNG", extensions: ["png"] },
    ],
  });

  if (!result.canceled) {
    return result.filePath;
  }
}
```

**Notifications:**

```typescript
import { Notification } from "electrobun";

export function showExportCompleteNotification(filePath: string) {
  new Notification({
    title: "Export Complete",
    body: `Design exported to ${filePath}`,
  }).show();
}
```

---

## Development

**Run desktop app:**

```bash
# From repo root
bun run dev-desktop
```

**Build for production:**

```bash
bun run build
cd apps/desktop
bun run package
```

---

## Platform-Specific Notes

### macOS
- Use `Cmd` for keyboard shortcuts
- Support dark mode via `nativeTheme`
- Add to dock with bounce animation for notifications

### Windows
- Use `Ctrl` for keyboard shortcuts
- Support Windows notifications
- Handle window state (minimize to tray)

### Linux
- Test on Ubuntu/GNOME
- Support system tray (may require libappindicator)

---

## Licensing Note

This app is AGPL-3.0 licensed. See root [AGENTS.md](../../AGENTS.md) for dual-license rules. Never statically import from `packages/pro/`.

---

## Related Guides

- [apps/web/AGENTS.md](../web/AGENTS.md) — Web frontend
- [packages/shared/AGENTS.md](../../packages/shared/AGENTS.md) — Shared types
