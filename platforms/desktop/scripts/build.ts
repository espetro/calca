// oxlint-disable unicorn/require-module-specifiers

import { existsSync } from "fs";
import { cp, mkdir } from "fs/promises";
import { resolve } from "path";

import { getLogger } from "@logtape/logtape";
import { $, path } from "zx";

import { initLogger } from "../src/logger";

const logDir = resolve(import.meta.dirname, "..", "logs");

await initLogger({ logDir, prefix: "build" });

const logger = getLogger(["calca", "build"]);

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const DESKTOP_DIR = path.resolve(REPO_ROOT, "platforms", "desktop");

// zx template literals on Windows interpret backslashes as escape sequences.
// Convert to forward slashes for safe interpolation in shell commands.
const posix = (p: string) => p.replace(/\\/g, "/");

const main = async () => {
  logger.info("==> Cleaning desktop build artifacts...");
  await $`bun run --cwd ${posix(DESKTOP_DIR)} clean`.nothrow();

  logger.info("==> Building web app...");
  await $`bun run --cwd ${posix(REPO_ROOT)} --filter=@app/web build`;

  logger.info("==> Copying web build to desktop Resources...");
  const webDir = path.resolve(REPO_ROOT, "apps", "web", "dist");
  const resourcesDir = path.resolve(DESKTOP_DIR, "Resources", "web");
  await mkdir(resourcesDir, { recursive: true });
  await cp(webDir, resourcesDir, { recursive: true, force: true });

  logger.info("==> Building Electrobun app...");
  const basePaths = [
    path.resolve(DESKTOP_DIR, "node_modules", ".bin", "electrobun"),
    path.resolve(REPO_ROOT, "node_modules", ".bin", "electrobun"),
  ];
  // On Windows, Bun installs binaries as .cmd or .exe wrappers
  const extensions = process.platform === "win32" ? ["", ".cmd", ".exe", ".ps1"] : [""];
  const electrobunPaths = basePaths.flatMap((p) =>
    extensions.map((ext) => p + ext),
  );
  const electrobunBin = electrobunPaths.find((p) => existsSync(p)) ?? null;
  if (!electrobunBin) {
    throw new Error(
      `electrobun binary not found. Searched: ${electrobunPaths.join(", ")}`,
    );
  }
  await $({ cwd: DESKTOP_DIR })`${electrobunBin} build --env=stable`;

  logger.info("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
