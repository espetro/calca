/**
 * * Runs all validation steps and just shows a simple ✅ (OK), ⚠️ (WARN), or ❌ (FAIL) for each validation check.
 */
import { $, ProcessOutput } from "zx";

interface Stage {
  display: string;
  cmd: string;
  onError?: (_: ProcessOutput) => string | null;
}

const warnOnError = ({ stdout, stderr }: ProcessOutput): string | null => {
  const output = stdout + stderr;
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

const stages: Stage[] = [
  { display: "TypeScript", cmd: "typecheck" },
  { display: "Lint", cmd: "lint", onError: warnOnError },
  { display: "Format", cmd: "format" },
  { display: "Test", cmd: "test" },
];

const runStage = async ({ display, cmd, onError }: Stage): Promise<{ line: string; ok: boolean }> => {
  try {
    await $`bunx turbo ${cmd}`.quiet();
    return { line: `Running ${display}... ✅`, ok: true };
  } catch (error) {
    if (error instanceof ProcessOutput && onError) {
      const warningLine = onError(error);
      if (warningLine) {
        return { line: `Running ${display}... ${warningLine}`, ok: true };
      }
    }
    return { line: `Running ${display}... ❌`, ok: false };
  }
};

const main = async () => {
  const results = await Promise.all(stages.map(runStage));

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
