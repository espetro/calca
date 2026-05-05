import { copyFile, readFile, writeFile } from "fs/promises";
import { resolve } from "path";

import type { Logger } from "@logtape/logtape";

export const SCRIPT_DIR = import.meta.dirname;
export const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..", "..");
export const DESKTOP_DIR = resolve(REPO_ROOT, "platforms", "desktop");

/** Preloads Design Artifact dependencies so we don't need to pull them from a CDN on every item */
export const loadArtifactDependencies = async (source: string, logger: Logger) => {
  logger.info("==> Copying Tailwind CSS browser bundle...");
  const tailwindSource = resolve(
    REPO_ROOT,
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
