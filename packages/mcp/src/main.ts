import { defineCommand, runMain } from "citty";

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
    skill: () => import("./commands/skill").then((r) => r.skillCommand),
    install: () => import("./install").then((r) => r.installCommand),
  },
});

if (import.meta.main) {
  await runMain(main);
}
