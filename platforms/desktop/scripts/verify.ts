// oxlint-disable unicorn/require-module-specifiers

import * as path from "path";

import { $ } from "bun";

const HOST = "127.0.0.1";
const PORT = parseInt(process.env.CALCA_PORT ?? "3847", 10);
const HEALTH_URL = `http://${HOST}:${PORT}/health`;
const BUILD_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "desktop",
  "build",
  "stable-macos-arm64",
);
const ARTIFACTS_DIR = path.resolve(import.meta.dirname, "..", "..", "desktop", "artifacts");

interface Metrics {
  startupTimeMs: number;
  healthResponse: unknown;
  passed: boolean;
  errors: string[];
}

const checkDir = async (dir: string) => {
  const { stdout } = await $`ls "${dir}" 2>/dev/null`;
  const names = stdout
    .toString()
    .split("\n")
    .filter((n) => n.endsWith(".app"));

  return await Promise.all(
    names
      .filter((_) => _.trim())
      .map(async (name) => {
        const absPath = path.join(dir, name.trim());
        const { mtime } = await Bun.file(absPath).stat();
        return { absPath, mtime };
      }),
  );
};
async function findLatestApp(): Promise<string> {
  const searchDirs = [BUILD_DIR, ARTIFACTS_DIR];

  const results = await Promise.all(searchDirs.flatMap(checkDir));
  const found = results.flat();

  if (found.length === 0) {
    throw new Error(`No .app bundles found in build/ or artifacts/`);
  }

  found.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return found[0].absPath;
}

async function isPortInUse(port: number): Promise<boolean> {
  try {
    const conn = await new Promise((resolve) => {
      const net = require("net");
      const s = net.createConnection(port, HOST);
      s.on("connect", () => {
        s.destroy();
        resolve(true);
      });
      s.on("error", () => {
        s.destroy();
        resolve(false);
      });
    });
    return conn as boolean;
  } catch {
    return false;
  }
}

async function launchApp(appPath: string): Promise<number> {
  const launcher = path.join(appPath, "Contents", "MacOS", "launcher");
  const env = {
    ...process.env,
    NODE_ENV: "production",
    CALCA_PORT: String(PORT),
  };
  const proc = Bun.spawn([launcher], {
    env,
    stdout: "inherit",
    stderr: "inherit",
    detached: true,
  });
  await Bun.sleep(1000);
  const pids = await $`pgrep -f "Calca"`.quiet();
  const pid = parseInt(pids.stdout.toString().trim().split("\n")[0] ?? "0", 10);
  return pid;
}

async function waitForHealth(timeoutMs: number): Promise<{ elapsed: number; response: unknown }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const start = Date.now();
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        return { elapsed, response: json };
      }
    } catch {}
    await Bun.sleep(500);
  }
  throw new Error(`Health endpoint not available within ${timeoutMs}ms`);
}

async function killApp(): Promise<void> {
  await $`pkill -f "Calca"`.quiet();
}

function printReport(metrics: Metrics, warnThreshold: number, failThreshold: number): void {
  const { startupTimeMs, healthResponse, passed, errors } = metrics;
  const status = passed ? "✅ PASS" : "❌ FAIL";

  console.log(`\n${"=".repeat(50)}`);
  console.log(`  Calca Desktop App Verification`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  Status:    ${status}`);
  console.log(`  Startup:   ${startupTimeMs}ms`);

  if (startupTimeMs < warnThreshold) {
    console.log(`  Grade:     🟢 Fast`);
  } else if (startupTimeMs < failThreshold) {
    console.log(`  Grade:     🟡 Slow`);
  } else {
    console.log(`  Grade:     🔴 Too slow`);
  }

  console.log(`  Health:    ${JSON.stringify(healthResponse)}`);

  if (errors.length > 0) {
    console.log(`\n  Errors:`);
    for (const e of errors) {
      console.log(`    - ${e}`);
    }
  }

  console.log(`${"=".repeat(50)}\n`);
}

const main = async () => {
  const args = Bun.argv.slice(2);
  let timeoutMs = 30_000;
  let warnThreshold = 5000;
  let failThreshold = 15_000;
  let keepAlive = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--timeout") timeoutMs = parseInt(args[++i], 10);
    else if (args[i] === "--warn") warnThreshold = parseInt(args[++i], 10);
    else if (args[i] === "--fail") failThreshold = parseInt(args[++i], 10);
    else if (args[i] === "--keep-alive") keepAlive = true;
    else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`Usage: verify.ts [options]
Options:
  --timeout ms    Health check timeout (default: 30000)
  --warn ms       Warn threshold in ms (default: 5000)
  --fail ms       Fail threshold in ms (default: 15000)
  --keep-alive    Leave app running after verification`);
      process.exit(0);
    }
  }

  console.log("==> Finding latest .app bundle...");
  let appPath: string;
  try {
    appPath = await findLatestApp();
    console.log(`    Found: ${path.basename(appPath)}`);
  } catch (e) {
    console.error(`❌ ${e}`);
    process.exit(1);
  }

  if (await isPortInUse(PORT)) {
    console.log(`⚠️  Port ${PORT} already in use — killing existing Calca instance...`);
    await killApp();
    await Bun.sleep(500);
  }

  console.log("==> Launching app...");
  const startTime = Date.now();
  let pid: number;
  try {
    pid = await launchApp(appPath);
    console.log(`    PID: ${pid}`);
  } catch (e) {
    console.error(`❌ Failed to launch: ${e}`);
    process.exit(1);
  }

  console.log("==> Waiting for health endpoint...");
  let healthResponse: unknown;
  let elapsed = 0;
  try {
    const result = await waitForHealth(timeoutMs);
    elapsed = result.elapsed;
    healthResponse = result.response;
    console.log(`    OK (response time: ${elapsed}ms)`);
  } catch (e) {
    const totalElapsed = Date.now() - startTime;
    const errors = [`Health check failed: ${e}`];
    const metrics: Metrics = {
      startupTimeMs: totalElapsed,
      healthResponse: null,
      passed: false,
      errors,
    };
    printReport(metrics, warnThreshold, failThreshold);
    console.error("❌ App failed to start within timeout.");
    await killApp();
    process.exit(1);
  }

  const startupTimeMs = Date.now() - startTime;
  const passed = startupTimeMs < failThreshold;
  const errors: string[] = [];
  if (!passed) errors.push(`Startup took ${startupTimeMs}ms (threshold: ${failThreshold}ms)`);

  const metrics: Metrics = { startupTimeMs, healthResponse, passed, errors };
  printReport(metrics, warnThreshold, failThreshold);

  if (!keepAlive) {
    console.log("==> Cleaning up...");
    await killApp();
  }

  process.exit(passed ? 0 : 1);
};

await main();
