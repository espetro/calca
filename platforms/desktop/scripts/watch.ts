// oxlint-disable unicorn/require-module-specifiers
// oxlint-disable no-await-in-loop
import { resolve } from "path";

import { getLogger } from "@logtape/logtape";

import { initLogger } from "../src/logger";

const ROOT = resolve(import.meta.dirname, "..", "..");
const LOG_DIR = resolve(import.meta.dirname, "..", "logs");
const WEB_LOG_PATH = resolve(LOG_DIR, "dev-web.log");
const DESKTOP_LOG_PATH = resolve(LOG_DIR, "dev-desktop.log");

await initLogger({ logDir: LOG_DIR, prefix: "build" });

const logger = getLogger(["calca", "build"]);

const waitForViteReady = async () => {
  logger.info("==> Waiting for Vite dev server...");
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://localhost:5173");
      if (res.ok) {
        logger.info("==> Vite ready on http://localhost:5173");
        return;
      }
    } catch {}

    await Bun.sleep(500);
  }
  logger.info("==> ⚠️  Vite dev server timeout — app may not load correctly");
};

const main = async () => {
  const webLog = Bun.file(WEB_LOG_PATH);
  const desktopLog = Bun.file(DESKTOP_LOG_PATH);

  logger.info("==> Starting Calca dev mode...");
  logger.info(`==> Logs: ${LOG_DIR}`);

  logger.info("==> Starting Vite dev server...");
  const webProc = Bun.spawn(["bun", "run", `--cwd ${ROOT}`, "--filter=@app/web", "dev"], {
    stdout: webLog,
    stderr: webLog,
  });

  await waitForViteReady();

  logger.info("==> Starting Electrobun desktop app...");
  const electrobunProc = Bun.spawn(
    ["bun", "run", `--cwd ${ROOT}`, "--filter=@app/electrobun", "watch"],
    {
      stdout: desktopLog,
      stderr: desktopLog,
      onExit() {
        webProc.kill();
        process.exit();
      },
    },
  );

  process.on("SIGINT", () => {
    logger.info("\n==> Shutting down...");
    webProc.kill();
    electrobunProc.kill();
    process.exit();
  });
};

await main();

export {};
