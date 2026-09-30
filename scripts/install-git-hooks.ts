/**
 * Installs the repo's simple-git-hooks (commit-msg, pre-push) after install.
 *
 * Never fails the install: sandboxes, CI checkouts without `.git`, or read-only
 * mounts can't host hooks — warn and exit 0 so plain `bun install` works there.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

const main = async () => {
  if (!existsSync(join(root, ".git"))) {
    console.warn("[install-git-hooks] no .git directory — skipping hook install");
    return;
  }

  try {
    const proc = Bun.spawn(["bunx", "simple-git-hooks"], {
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    });
    const code = await proc.exited;
    if (code !== 0) {
      console.warn(`[install-git-hooks] simple-git-hooks exited ${code} — skipping hook install`);
    }
  } catch (error) {
    console.warn(`[install-git-hooks] could not install hooks — skipping (${error})`);
  }
};

await main();
