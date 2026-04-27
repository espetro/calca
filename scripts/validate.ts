#!/usr/bin/env bun
import { $ } from "zx";

const stages = [
  { display: "TypeScript", turbo: "typecheck" },
  { display: "Lint", turbo: "lint" },
  { display: "Format", turbo: "format" },
  { display: "Test", turbo: "test" },
];

let failed = false;

for (const { display, turbo } of stages) {
  process.stdout.write(`Running ${display}... `);

  try {
    await $`bunx turbo ${turbo}`.quiet();
    console.log("✅");
  } catch {
    console.log("❌");
    failed = true;
  }
}

console.log("");
if (failed) {
  process.exit(1);
} else {
  console.log("All checks passed!");
}
