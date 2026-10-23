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
    formats: {
      type: "string",
      description:
        "Directory of output format manifests to load (default: discover .calca/formats dirs)",
    },
  },
  async run(ctx) {
    // Back-compat: `calca mcp install <host>` routes to the top-level install
    // command (docs/skills reference this form). Positionals land in args._
    // because citty no longer sees "install" as an mcp subcommand.
    if (ctx.args._?.[0] === "install") {
      const { runInstall } = await import("../install");
      return runInstall({
        host: ctx.args._[1] as string,
        print: ctx.args.print === true,
      });
    }
    const { args } = ctx;
    const session = await loadSession({
      file: args.file,
      agentId: args.agent,
      formatsDir: args.formats,
    });
    const server = createCalcaMcpServer(session);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    consola.debug("calca mcp server listening on stdio");
  },
});
