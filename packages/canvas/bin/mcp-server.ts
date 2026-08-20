#!/usr/bin/env bun
// Calca canvas MCP server — stdio transport
// Exposes canvas state as MCP tools for coding agents (pi.dev, Claude Code).
//
// Integration (Option A — desktop app spawns the server):
//
//   The desktop / Next app owns the canonical canvas state (Jotai atoms,
//   localStorage, IndexedDB, etc.).  It spawns this binary as a child process
//   and keeps the stdio pipes.  The server starts with a state snapshot and
//   answers tool calls from the MCP client; mutations made through the server
//   are returned to the client and can be mirrored back to the app's state by
//   a future remote CanvasStore implementation (file watcher, local HTTP
//   socket, stdin JSON-RPC bridge, etc.).
//
//   Example spawn from the desktop app (Bun/Node):
//
//     import { spawn } from "node:child_process";
//     import { getCanvasStateSnapshot } from "./canvas-state";
//
//     const snapshotPath = "/tmp/calca-canvas-snapshot.json";
//     await Bun.write(snapshotPath, JSON.stringify(getCanvasStateSnapshot()));
//
//     const mcp = spawn(
//       "bun",
//       ["run", "packages/canvas/bin/mcp-server.ts", "--state", snapshotPath],
//       { stdio: ["pipe", "pipe", "pipe"] },
//     );
//
//     // Forward MCP messages between the coding agent and the server.
//     agentStdio.pipe(mcp.stdin);
//     mcp.stdout.pipe(agentStdio);
//     mcp.stderr.on("data", (chunk) => console.debug("mcp:", chunk.toString()));
//
//   For a fully stateless translator, replace InMemoryCanvasStore with a
//   remote store that forwards each operation to the parent process via a
//   side channel (e.g. a local UNIX socket or HTTP endpoint passed through an
//   env var such as CALCA_CANVAS_API_URL).

import type { Point } from "@app/shared";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";

interface CanvasFrame {
  id: string;
  html: string;
  width: number;
  height: number;
  label: string;
  position: Point;
}

interface CanvasStore {
  getFrames(): CanvasFrame[];
  addFrame(frame: Omit<CanvasFrame, "id">): CanvasFrame;
  updateFrame(id: string, updates: Partial<Omit<CanvasFrame, "id">>): boolean;
  removeFrame(id: string): boolean;
}

class InMemoryCanvasStore implements CanvasStore {
  private frames: CanvasFrame[] = [];

  constructor(initial: CanvasFrame[] = []) {
    this.frames = initial.map((f) => ({ ...f }));
  }

  getFrames(): CanvasFrame[] {
    return this.frames.map((f) => ({ ...f }));
  }

  addFrame(frame: Omit<CanvasFrame, "id">): CanvasFrame {
    const id = generateId();
    const created: CanvasFrame = { ...frame, id };
    this.frames.push(created);
    return { ...created };
  }

  updateFrame(id: string, updates: Partial<Omit<CanvasFrame, "id">>): boolean {
    const index = this.frames.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.frames[index] = { ...this.frames[index], ...updates };
    return true;
  }

  removeFrame(id: string): boolean {
    const index = this.frames.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.frames.splice(index, 1);
    return true;
  }
}

function generateId(): string {
  return `frame_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function autoPosition(frames: CanvasFrame[]): Point {
  const offset = frames.length * 40;
  return { x: 100 + offset, y: 100 + offset };
}

function autoLabel(frames: CanvasFrame[]): string {
  return `Frame ${frames.length + 1}`;
}

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const AddDesignFrameSchema = z.object({
  html: z.string(),
  width: z.number().optional().default(400),
  height: z.number().optional().default(300),
  label: z.string().optional(),
  position: PositionSchema.optional(),
});

const UpdateFrameSchema = z.object({
  frameId: z.string(),
  html: z.string().optional(),
  label: z.string().optional(),
  position: PositionSchema.optional(),
});

const RemoveFrameSchema = z.object({
  frameId: z.string(),
});

const ExportCanvasSchema = z.object({
  format: z.enum(["json", "html", "png"]),
});

function okText(value: unknown): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
  };
}

function errText(message: string): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  console.error("tool error:", message);
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function composeHtmlDocument(frames: CanvasFrame[]): string {
  const items = frames
    .map(
      (f) =>
        `<!-- ${f.label} (${f.id}) -->\n` +
        `<div style="position:absolute;left:${f.position.x}px;top:${f.position.y}px;width:${f.width}px;height:${f.height}px;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:8px;overflow:hidden;">\n` +
        `${f.html}\n` +
        `</div>`,
    )
    .join("\n\n");

  return (
    `<!DOCTYPE html>\n` +
    `<html><head><meta charset="utf-8"><title>Calca Export</title></head>\n` +
    `<body style="position:relative;margin:0;padding:0;background:#f5f5f5;min-height:100vh;">\n` +
    `${items}\n` +
    `</body></html>`
  );
}

function createServer(store: CanvasStore): McpServer {
  const server = new McpServer(
    {
      name: "calca-canvas",
      version: process.env.npm_package_version ?? "0.6.1",
    },
    {
      capabilities: { tools: {} },
      instructions:
        "Calca canvas MCP server. Use these tools to add, update, remove, " +
        "query and export HTML design frames on an infinite canvas.",
    },
  );

  server.registerTool(
    "addDesignFrame",
    {
      description: "Add a new HTML design frame to the canvas.",
      inputSchema: AddDesignFrameSchema,
    },
    async (args) => {
      const frames = store.getFrames();
      const frame = store.addFrame({
        html: args.html,
        width: args.width,
        height: args.height,
        label: args.label ?? autoLabel(frames),
        position: args.position ?? autoPosition(frames),
      });
      console.error("addDesignFrame:", frame.id);
      return okText({ frameId: frame.id });
    },
  );

  server.registerTool(
    "updateFrame",
    {
      description: "Update an existing frame's HTML or metadata.",
      inputSchema: UpdateFrameSchema,
    },
    async (args) => {
      const updates: Partial<Omit<CanvasFrame, "id">> = {};
      if (args.html !== undefined) updates.html = args.html;
      if (args.label !== undefined) updates.label = args.label;
      if (args.position !== undefined) updates.position = args.position;

      const ok = store.updateFrame(args.frameId, updates);
      if (!ok) return errText(`Frame not found: ${args.frameId}`);
      console.error("updateFrame:", args.frameId);
      return okText({ success: true });
    },
  );

  server.registerTool(
    "removeFrame",
    {
      description: "Remove a frame from the canvas.",
      inputSchema: RemoveFrameSchema,
    },
    async (args) => {
      const ok = store.removeFrame(args.frameId);
      if (!ok) return errText(`Frame not found: ${args.frameId}`);
      console.error("removeFrame:", args.frameId);
      return okText({ success: true });
    },
  );

  server.registerTool(
    "getCanvas",
    {
      description: "Return a snapshot of all frames on the canvas.",
    },
    async () => {
      const frames = store.getFrames();
      return okText({ frames, total: frames.length });
    },
  );

  server.registerTool(
    "exportCanvas",
    {
      description: "Export all frames as JSON, composed HTML, or PNG.",
      inputSchema: ExportCanvasSchema,
    },
    async (args) => {
      const frames = store.getFrames();

      switch (args.format) {
        case "json": {
          return okText({
            data: JSON.stringify(frames),
            mimeType: "application/json",
          });
        }
        case "html": {
          return okText({
            data: composeHtmlDocument(frames),
            mimeType: "text/html",
          });
        }
        case "png": {
          return errText(
            "PNG export requires a browser rendering context and is not supported in the Node.js stdio server. " +
              "Use the web canvas UI or a headless browser service for screenshots.",
          );
        }
        default: {
          // Exhaustiveness guard — unreachable because zod validates the enum.
          return errText(`Unsupported export format: ${String(args.format)}`);
        }
      }
    },
  );

  return server;
}

function parseArgs(argv: string[]): { statePath?: string } {
  const args: { statePath?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--state" && i + 1 < argv.length) {
      args.statePath = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function loadInitialState(statePath: string | undefined): Promise<CanvasFrame[]> {
  if (!statePath) return [];
  const file = Bun.file(statePath);
  if (!(await file.exists())) return [];
  const raw = await file.text();
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : generateId(),
      html: typeof item.html === "string" ? item.html : "",
      width: typeof item.width === "number" ? item.width : 400,
      height: typeof item.height === "number" ? item.height : 300,
      label: typeof item.label === "string" ? item.label : "Frame",
      position:
        typeof item.position === "object" &&
        item.position !== null &&
        "x" in item.position &&
        "y" in item.position
          ? {
              x: Number((item.position as { x?: unknown }).x ?? 0),
              y: Number((item.position as { y?: unknown }).y ?? 0),
            }
          : { x: 0, y: 0 },
    }));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const initialFrames = await loadInitialState(args.statePath);
  const store = new InMemoryCanvasStore(initialFrames);
  const server = createServer(store);

  const transport = new StdioServerTransport(process.stdin, process.stdout);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("Calca canvas MCP server started on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
