import { createCanvasSession } from "@calca/mcp-core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { createCalcaMcpServer } from "./server";

async function createClientServer() {
  const session = createCanvasSession({ agentId: "test-agent" });
  const server = createCalcaMcpServer(session);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, session };
}

describe("calca mcp server", () => {
  it("lists the contract tools", async () => {
    const { client } = await createClientServer();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual([
      "canvas.read",
      "canvas.apply",
      "canvas.propose",
      "canvas.lease",
      "canvas.release",
      "canvas.comment",
      "canvas.arrange",
    ]);
    for (const tool of tools) {
      expect(tool.description).toContain("untrusted data");
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("round-trips a propose + apply through callTool", async () => {
    const { client, session } = await createClientServer();

    const propose = await client.callTool({
      name: "canvas.propose",
      arguments: {
        requestId: "req-1",
        title: "add a frame",
        commands: [
          {
            op: "create-shape",
            record: {
              id: "frame-1",
              type: "design-frame",
              parentId: null,
              index: "a0",
              props: { position: { x: 0, y: 0 } },
            },
          },
        ],
      },
    });
    expect(propose.isError).toBeUndefined();
    const proposal = propose.structuredContent as { proposal?: { id: string } };
    expect(proposal.proposal?.id).toBeTruthy();

    const apply = await client.callTool({
      name: "canvas.apply",
      arguments: {
        requestId: "req-2",
        proposalId: proposal.proposal!.id,
      },
    });
    expect(apply.isError).toBeUndefined();
    expect(session.store.get("frame-1")?.type).toBe("design-frame");

    const read = await client.callTool({
      name: "canvas.read",
      arguments: { scope: "summary" },
    });
    expect(read.isError).toBeUndefined();
    expect(JSON.stringify(read.structuredContent)).toContain("frame-1");
  });
});
