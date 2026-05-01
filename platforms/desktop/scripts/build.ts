// oxlint-disable unicorn/require-module-specifiers

import { existsSync } from "fs";
import { cp, mkdir } from "fs/promises";
import { resolve } from "path";

import { getLogger } from "@logtape/logtape";

import { initLogger } from "../src/logger";

const logDir = resolve(import.meta.dirname, "..", "logs");

await initLogger({ logDir, prefix: "build" });

const logger = getLogger(["calca", "build"]);

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..", "..");
const DESKTOP_DIR = resolve(REPO_ROOT, "platforms", "desktop");

async function run(
  cmd: string[],
  opts?: { cwd?: string; allowFail?: boolean },
): Promise<number> {
  const proc = Bun.spawn(cmd, {
    cwd: opts?.cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0 && !opts?.allowFail) {
    throw new Error(`${cmd.join(" ")} exited with code ${exitCode}`);
  }
  return exitCode;
}

const main = async () => {
  logger.info("==> Cleaning desktop build artifacts...");
  await run(["bun", "run", "--cwd", DESKTOP_DIR, "clean"], { allowFail: true });

  logger.info("==> Building web app...");
  await run(["bun", "run", "--cwd", REPO_ROOT, "--filter=@app/web", "build"]);

  logger.info("==> Copying web build to desktop Resources...");
  const webDir = resolve(REPO_ROOT, "apps", "web", "dist");
  const resourcesDir = resolve(DESKTOP_DIR, "Resources", "web");
  await mkdir(resourcesDir, { recursive: true });
  await cp(webDir, resourcesDir, { recursive: true, force: true });

  logger.info("==> Building Electrobun app...");
  const basePaths = [
    resolve(DESKTOP_DIR, "node_modules", ".bin", "electrobun"),
    resolve(REPO_ROOT, "node_modules", ".bin", "electrobun"),
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
  await run([electrobunBin, "build", "--env=stable"], { cwd: DESKTOP_DIR });

  logger.info("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
