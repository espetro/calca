import { readFile } from "node:fs/promises";

import { createCanvasSession } from "@calca/mcp-core";
import { defineCommand } from "citty";
import { consola } from "consola";

export const openCommand = defineCommand({
  meta: {
    name: "open",
    description:
      "Inspect a board file (JSON snapshot). Full visual open lands with the web build (Phase 3).",
  },
  args: {
    file: {
      type: "positional",
      description: "board file to open",
      required: true,
    },
  },
  async run({ args }) {
    const snapshot = JSON.parse(await readFile(args.file, "utf8"));
    const session = createCanvasSession({ snapshot, agentId: "cli" });
    const shapes = session.store.records;
    const byType = new Map<string, number>();
    for (const record of shapes.values()) {
      byType.set(record.type, (byType.get(record.type) ?? 0) + 1);
    }
    consola.info(`${args.file}: ${shapes.size} record(s)`);
    for (const [type, count] of [...byType].toSorted()) {
      consola.log(`  ${type}: ${count}`);
    }
  },
});
