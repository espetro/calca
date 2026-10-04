import { toolContract, type CanvasSession } from "@calca/mcp-core";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { version } from "../package.json" with { type: "json" };

const contractByName = new Map(toolContract.map((t) => [t.name, t]));

export function createCalcaMcpServer(session: CanvasSession): Server {
  const server = new Server({ name: "calca", version }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: toolContract.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: t.annotations,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = contractByName.get(request.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `unknown tool: ${request.params.name}` }],
      };
    }
    try {
      const result = await tool.handler(session, request.params.arguments ?? {});
      return {
        ...(typeof result === "object" && result !== null
          ? { structuredContent: result as Record<string, unknown> }
          : {}),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  });

  return server;
}
