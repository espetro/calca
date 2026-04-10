#!/usr/bin/env bun
import { $ } from 'bun';

const checks = [
  { name: 'oxlint', cmd: 'bunx oxlint' },
  { name: 'oxfmt', cmd: 'bunx oxfmt --check' },
  { name: 'tsc', cmd: 'bunx tsc --noEmit' },
  { name: 'vitest', cmd: 'bunx vitest run' },
];

let failed = false;

for (const check of checks) {
  process.stdout.write(`Running ${check.name}... `);

  try {
    await $`${check.cmd}`.quiet();
    console.log('✅');
  } catch (error) {
    console.log('❌');
    failed = true;
    process.exit(1);
  }
}

if (!failed) {
  console.log('All checks passed!');
}
