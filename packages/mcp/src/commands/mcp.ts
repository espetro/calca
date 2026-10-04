import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { defineCommand } from "citty";
import { consola } from "consola";

import { createCalcaMcpServer } from "../server";
import { loadSession } from "../session";

export const mcpCommand = defineCommand({
  meta: {
    name: "mcp",
    description: "Run the calca MCP server over stdio",
  },
  args: {
    file: {
      type: "string",
      description: "Board file to load (JSON snapshot). Autosaves on change.",
    },
    agent: {
      type: "string",
      description: "Agent principal id for command origins and leases",
      default: "mcp-agent",
    },
  },
  subCommands: {
    install: () => import("../install").then((r) => r.installCommand),
  },
  async run({ args }) {
    const session = await loadSession({ file: args.file, agentId: args.agent });
    const server = createCalcaMcpServer(session);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    consola.debug("calca mcp server listening on stdio");
  },
});
