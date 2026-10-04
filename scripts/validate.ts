/**
 * * Runs all validation steps and just shows a simple ✅ (OK), ⚠️ (WARN), or ❌ (FAIL) for each validation check.
 */
import { join } from "node:path";

import { $ } from "bun";

const MANIFESTS_CHECK = join(import.meta.dir, "check-workspace-manifests.ts");
const BOUNDARIES_CHECK = join(import.meta.dir, "check-canvas-boundaries.ts");
const BUDGETS_CHECK = join(import.meta.dir, "check-bundle-budgets.ts");

interface Stage {
  display: string;
  /** turbo task name, or a raw command when `raw` is set */
  cmd: string;
  raw?: boolean;
  onError?: (_: $.ShellError) => string | null;
}

interface StageOutput {
  line: string;
  ok: boolean;
}

const warnOnError = ({ stdout, stderr }: $.ShellError): string | null => {
  const output = stdout.toString("utf-8") + stderr.toString("utf-8");
  const lintResults = [...output.matchAll(/Found (\d+) warnings? and (\d+) errors?/g)];

  if (lintResults.length > 0) {
    const totalErrors = lintResults.reduce((sum, match) => sum + parseInt(match[2]!, 10), 0);
    const totalWarnings = lintResults.reduce((sum, match) => sum + parseInt(match[1]!, 10), 0);

    if (totalErrors === 0 && totalWarnings > 0) {
      return `⚠️  (${totalWarnings} linter warning${totalWarnings === 1 ? "" : "s"})`;
    }
  }

  return null;
};

const quickStages: Stage[] = [
  { display: "Manifests", cmd: `bun ${MANIFESTS_CHECK}`, raw: true },
  { display: "TypeScript", cmd: "typecheck" },
  { display: "Lint", cmd: "lint", onError: warnOnError },
  { display: "Format", cmd: "format" },
];

const stages: Stage[] = [
  ...quickStages,
  { display: "Test", cmd: "test" },
  {
    display: "Canvas build",
    cmd: "bunx turbo build --filter=@calca/canvas-base --filter=@calca/canvas-ui --filter=@calca/canvas-flow",
    raw: true,
  },
  { display: "Pack (publint/attw)", cmd: "check:pack" },
  { display: "Boundaries", cmd: `bun ${BOUNDARIES_CHECK}`, raw: true },
  { display: "Budgets", cmd: `bun ${BUDGETS_CHECK}`, raw: true },
  { display: "Smoke", cmd: "bun packages/canvas-base/smoke.mjs", raw: true },
];

const runStage = async (
  { display, cmd, raw, onError }: Stage,
  filter?: string,
): Promise<StageOutput> => {
  try {
    if (raw) {
      const [bin, ...args] = cmd.split(" ");
      await $`${bin} ${args}`.quiet();
      return { line: `Running ${display}... ✅`, ok: true };
    }
    const turboCmd = filter
      ? $`bunx turbo ${cmd} --filter=${filter}`.quiet()
      : $`bunx turbo ${cmd}`.quiet();
    await turboCmd;
    return { line: `Running ${display}... ✅`, ok: true };
  } catch (error) {
    if (error instanceof $.ShellError && onError) {
      const warningLine = onError(error);
      if (warningLine) {
        return { line: `Running ${display}... ${warningLine}`, ok: true };
      }
    }
    return { line: `Running ${display}... ❌`, ok: false };
  }
};

const getPackageName = async (cwdValue: string) => {
  const cwdPath = cwdValue.startsWith("/") ? cwdValue : `${process.cwd()}/${cwdValue}`;
  const pkgJson: { name: string } = await Bun.file(`${cwdPath}/package.json`).json();
  return pkgJson.name;
};

const parseArgs = async () => {
  const argv = process.argv;
  const cwdIndex = argv.indexOf("--cwd");
  const cwdValue = argv[cwdIndex + 1];

  const filter = cwdIndex !== -1 && cwdValue ? await getPackageName(cwdValue) : undefined;

  const quick = argv.includes("--quick");

  return { filter, quick };
};

const main = async () => {
  const { filter, quick } = await parseArgs();

  const activeStages = quick ? quickStages : stages;
  // Canvas dist must exist before pack/budgets/smoke run.
  const buildStage = activeStages.find((s) => s.display === "Canvas build");
  const rest = activeStages.filter((s) => s !== buildStage);
  const results: StageOutput[] = [];
  if (buildStage) {
    results.push(await runStage(buildStage, filter));
  }
  results.push(...(await Promise.all(rest.map((stage) => runStage(stage, filter)))));

  for (const { line } of results) {
    console.log(line);
  }

  console.log("");

  if (!results.every((r) => r.ok)) {
    return process.exit(1);
  }

  return console.log("All checks passed!");
};

await main();
