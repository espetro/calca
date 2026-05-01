// oxlint-disable unicorn/require-module-specifiers

import { existsSync } from "fs";
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

const main = async () => {
  logger.info("==> Cleaning desktop build artifacts...");
  await $`bun run --cwd ${DESKTOP_DIR} clean`.nothrow();

  logger.info("==> Building web app...");
  await $`bun run --cwd ${REPO_ROOT} --filter=@app/web build`;

  logger.info("==> Copying web build to desktop Resources...");
  await $`mkdir -p ${DESKTOP_DIR}/Resources/web`;
  await $`cp -r ${REPO_ROOT}/apps/web/dist/* ${DESKTOP_DIR}/Resources/web/`;

  logger.info("==> Building Electrobun app...");
  const electrobunPaths = [
    path.resolve(DESKTOP_DIR, "node_modules", ".bin", "electrobun"),
    path.resolve(REPO_ROOT, "node_modules", ".bin", "electrobun"),
  ];
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
