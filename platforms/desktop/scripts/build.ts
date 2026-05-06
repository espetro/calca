import { resolve } from "path";

import { DESKTOP_DIR, loadArtifactDependencies, logger, REPO_ROOT } from "./utils.js";

const WEB_DIR = resolve(REPO_ROOT, "apps", "web", "dist");

const runWebBuild = async () => {
  const response = Bun.spawn(["bun", "run", "--cwd", REPO_ROOT, "--filter=@app/web", "build"], {
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exit = await response.exited;

  if (exit !== 0) {
    throw new Error(`Web build exited with code ${exit}`);
  }
};

const runDesktopBuild = async () => {
  logger.info("==> Building Electrobun app...");
  const response = Bun.spawn(["electrobun", "build", "--env=stable"], {
    cwd: DESKTOP_DIR,
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exit = await response.exited;

  if (exit !== 0) {
    throw new Error(`Electrobun build exited with code ${exit}`);
  }
};

const main = async () => {
  logger.info("==> Building web app...");

  await runWebBuild();
  await loadArtifactDependencies(WEB_DIR);
  await runDesktopBuild();

  logger.info("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
