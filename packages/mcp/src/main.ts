import { defineCommand } from "citty";

import { version } from "../package.json" with { type: "json" };

export const main = defineCommand({
  meta: {
    name: "calca",
    version,
    description: "Calca — agent playground CLI (MCP canvas tools)",
  },
  subCommands: {
    mcp: () => import("./commands/mcp.ts").then((r) => r.mcpCommand),
    open: () => import("./commands/open.ts").then((r) => r.openCommand),
  },
});
