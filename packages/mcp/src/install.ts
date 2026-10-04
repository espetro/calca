import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";

import { defineCommand } from "citty";
import { consola } from "consola";
import { dirname, join } from "pathe";

const SERVER_ENTRY = {
  command: "npx",
  args: ["-y", "@calca/mcp@latest", "mcp"],
};

const TOML_ENTRY = `[mcp_servers.calca]
command = "npx"
args = ["-y", "@calca/mcp@latest", "mcp"]
`;

interface HostConfig {
  configPath: () => string;
  format: "json" | "toml";
  mcpServersKey?: string[];
}

const HOSTS: Record<string, HostConfig> = {
  "claude-code": {
    configPath: () => join(homedir(), ".claude.json"),
    format: "json",
    mcpServersKey: ["mcpServers"],
  },
  cursor: {
    configPath: () => join(homedir(), ".cursor", "mcp.json"),
    format: "json",
    mcpServersKey: ["mcpServers"],
  },
  "gemini-cli": {
    configPath: () => join(homedir(), ".gemini", "settings.json"),
    format: "json",
    mcpServersKey: ["mcpServers"],
  },
  opencode: {
    configPath: () => join(homedir(), ".config", "opencode", "opencode.json"),
    format: "json",
    mcpServersKey: ["mcp"],
  },
  codex: {
    configPath: () => join(homedir(), ".codex", "config.toml"),
    format: "toml",
  },
};

export const installCommand = defineCommand({
  meta: {
    name: "install",
    description:
      "Write the calca MCP server into an agent host's config (claude-code, cursor, gemini-cli, opencode, codex)",
  },
  args: {
    host: {
      type: "positional",
      description: `agent host (${Object.keys(HOSTS).join(", ")})`,
      required: true,
    },
    print: {
      type: "boolean",
      description: "Print the config fragment instead of writing",
    },
  },
  async run({ args }) {
    const host = HOSTS[args.host];
    if (!host) {
      consola.error(
        `unknown host "${args.host}" — expected one of: ${Object.keys(HOSTS).join(", ")}`,
      );
      process.exit(1);
    }
    const path = host.configPath();
    if (args.print) {
      if (host.format === "toml") {
        consola.log(TOML_ENTRY);
      } else {
        consola.log(JSON.stringify({ calca: SERVER_ENTRY }, null, 2));
      }
      return;
    }
    await installHost(host, path);
  },
});

async function installHost(host: HostConfig, path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  if (host.format === "toml") {
    const existing = existsSync(path) ? await readFile(path, "utf8") : "";
    if (existing.includes("[mcp_servers.calca]")) {
      consola.info(`calca already configured in ${path}`);
      return;
    }
    await writeFile(path, `${existing.trimEnd()}\n\n${TOML_ENTRY}`.trimStart());
    consola.success(`added calca MCP server to ${path}`);
    return;
  }

  const existing: Record<string, unknown> = existsSync(path)
    ? JSON.parse(await readFile(path, "utf8"))
    : {};
  const key = host.mcpServersKey ?? ["mcpServers"];
  let target = existing;
  for (const segment of key.slice(0, -1)) {
    target = (target[segment] ??= {}) as Record<string, unknown>;
  }
  const leaf = key[key.length - 1];
  const servers = (target[leaf] ??= {}) as Record<string, unknown>;
  if (servers.calca) {
    consola.info(`calca already configured in ${path}`);
    return;
  }
  servers.calca = SERVER_ENTRY;
  await writeFile(path, JSON.stringify(existing, null, 2) + "\n");
  consola.success(`added calca MCP server to ${path}`);
}
