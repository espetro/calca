// oxlint-disable unicorn/require-module-specifiers

import { $, path, cd } from "zx";

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const DESKTOP_DIR = path.resolve(REPO_ROOT, "platforms", "desktop");

const main = async () => {
  console.log("==> Cleaning desktop build artifacts...");
  cd(DESKTOP_DIR);
  await $`bun run clean`;

  console.log("==> Building web app...");
  cd(REPO_ROOT);
  await $`bun run --filter=@app/web build`;

  console.log("==> Copying web build to desktop Resources...");
  await $`mkdir -p ${DESKTOP_DIR}/Resources/web`;
  await $`cp -r ${REPO_ROOT}/apps/web/dist/* ${DESKTOP_DIR}/Resources/web/`;

  console.log("==> Building Electrobun app...");
  cd(DESKTOP_DIR);
  await $`./node_modules/.bin/electrobun build --env=stable`;

  console.log("==> Done! Artifacts in platforms/desktop/artifacts/");
};

await main();
