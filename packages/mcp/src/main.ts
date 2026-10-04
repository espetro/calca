import { defineCommand } from "citty";

import { version } from "../package.json" with { type: "json" };

export const main = defineCommand({
  meta: {
    name: "calca",
    version,
    description: "Calca — agent playground CLI (MCP canvas tools)",
  },
  subCommands: {
    mcp: () => import("./commands/mcp").then((r) => r.mcpCommand),
    open: () => import("./commands/open").then((r) => r.openCommand),
  },
});
