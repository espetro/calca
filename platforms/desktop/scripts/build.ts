// oxlint-disable unicorn/require-module-specifiers

import { existsSync } from "fs";
import { copyFile, cp, mkdir, readFile, writeFile } from "fs/promises";
import { resolve } from "path";

import { getLogger } from "@logtape/logtape";

import { initLogger } from "../src/logger";

const logDir = resolve(import.meta.dirname, "..", "logs");

await initLogger({ logDir, prefix: "build" });

const logger = getLogger(["calca", "build"]);

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..", "..");
const DESKTOP_DIR = resolve(REPO_ROOT, "platforms", "desktop");

const loadArtifactDependencies = async (source: string) => {
  logger.info("==> Copying Tailwind CSS browser bundle...");
  const tailwindSource = resolve(
    DESKTOP_DIR,
    "node_modules",
    "@tailwindcss",
    "browser",
    "dist",
    "index.global.js",
  );

  const tailwindTarget = resolve(source, "tailwindcss.js");
  await copyFile(tailwindSource, tailwindTarget);

  logger.info("==> Injecting desktop mode flag into index.html...");
  const indexPath = resolve(source, "index.html");
  const html = await readFile(indexPath, "utf8");

  const updated = html.replace(
    "<head>",
    "<head>\n  <script>window.__CALCA_DESKTOP__ = true;</script>",
  );
  await writeFile(indexPath, updated, "utf8");
};

interface RunOptions {
  cwd?: string;
  allowFail?: boolean;
}

const run = async (cmd: string[], opts?: RunOptions) => {
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
};

const main = async () => {
  logger.info("==> Cleaning desktop build artifacts...");
  await run(["bun", "run", "--cwd", DESKTOP_DIR, "clean"], { allowFail: true });

  logger.info("==> Building web app...");
  await run(["bun", "run", "--cwd", REPO_ROOT, "--filter=@app/web", "build"]);

  const webDir = resolve(REPO_ROOT, "apps", "web", "dist");
  await loadArtifactDependencies(webDir);

  logger.info("==> Copying web build to desktop Resources...");
  const resourcesDir = resolve(DESKTOP_DIR, "Resources", "web");
  await mkdir(resourcesDir, { recursive: true });
  await cp(webDir, resourcesDir, { recursive: true, force: true });

  logger.info("==> Building Electrobun app...");
  const basePaths = [
    resolve(DESKTOP_DIR, "node_modules", ".bin", "electrobun"),
    resolve(REPO_ROOT, "node_modules", ".bin", "electrobun"),
  ];

  // * On Windows, Bun installs binaries as .cmd or .exe wrappers
  const extensions = process.platform === "win32" ? ["", ".cmd", ".exe", ".ps1"] : [""];
  const electrobunPaths = basePaths.flatMap((p) => extensions.map((ext) => p + ext));
  const electrobunBin = electrobunPaths.find((p) => existsSync(p)) ?? null;

  if (!electrobunBin) {
    throw new Error(`electrobun binary not found. Searched: ${electrobunPaths.join(", ")}`);
  }

  await run([electrobunBin, "build", "--env=stable"], { cwd: DESKTOP_DIR });

  logger.info("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
