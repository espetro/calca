/**
 * Installs the repo's git hooks (declared in the `simple-git-hooks` map in
 * package.json) after `bun install`.
 *
 * We write the hook files ourselves instead of using the `simple-git-hooks`
 * package: that package's own postinstall crashes under Bun's `.bun` store
 * layout (it stats a path that doesn't exist), which used to force every
 * install to run with `--ignore-scripts`.
 *
 * Never fails the install: sandboxes, CI checkouts without `.git`, or read-only
 * mounts can't host hooks — warn and exit 0 so plain `bun install` works there.
 */
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

const HOOKS_KEY = "simple-git-hooks";

const main = async () => {
  const gitDir = join(root, ".git");
  if (!existsSync(gitDir)) {
    console.warn("[install-git-hooks] no .git directory — skipping hook install");
    return;
  }

  const pkg: Record<string, Record<string, string>> = await Bun.file(
    join(root, "package.json"),
  ).json();
  const hooks = pkg[HOOKS_KEY] ?? {};
  const names = Object.keys(hooks);
  if (names.length === 0) {
    console.warn(`[install-git-hooks] no "${HOOKS_KEY}" hooks configured — nothing to do`);
    return;
  }

  try {
    const hooksDir = join(gitDir, "hooks");
    mkdirSync(hooksDir, { recursive: true });
    for (const [name, command] of Object.entries(hooks)) {
      const path = join(hooksDir, name);
      writeFileSync(path, `#!/bin/sh\n${command}\n`, { mode: 0o755 });
      chmodSync(path, 0o755);
      console.log(`[install-git-hooks] ${name} → ${command}`);
    }
  } catch (error) {
    console.warn(`[install-git-hooks] could not write hooks — skipping (${error})`);
  }
};

await main();
