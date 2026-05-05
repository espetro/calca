import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";

import { getLogger } from "@logtape/logtape";

import { initLogger } from "../src/logger";
import { DESKTOP_DIR, SCRIPT_DIR, loadArtifactDependencies, REPO_ROOT } from "./utils";

// Bun's --cwd flag resolves .env from the target directory, not the project root.
// Load root .env manually so ELECTROBUN_* signing vars are available to child processes.
const rootEnvPath = resolve(REPO_ROOT, ".env");
if (existsSync(rootEnvPath)) {
  const envContent = await readFile(rootEnvPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const logDir = resolve(SCRIPT_DIR, "..", "logs");
await initLogger({ logDir, prefix: "build" });
const logger = getLogger(["calca", "build"]);

const main = async () => {
  logger.info("==> Building web app...");
  const webBuild = Bun.spawn(["bun", "run", "--cwd", REPO_ROOT, "--filter=@app/web", "build"], {
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });
  const webExit = await webBuild.exited;
  if (webExit !== 0) throw new Error(`Web build exited with code ${webExit}`);

  const webDir = resolve(REPO_ROOT, "apps", "web", "dist");
  await loadArtifactDependencies(webDir, logger);

  logger.info("==> Building Electrobun app...");
  const build = Bun.spawn(["electrobun", "build", "--env=stable"], {
    cwd: DESKTOP_DIR,
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });
  const buildExit = await build.exited;
  if (buildExit !== 0) throw new Error(`Electrobun build exited with code ${buildExit}`);

  logger.info("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
