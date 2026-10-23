import { cpSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { defineCommand } from "citty";
import { consola } from "consola";
import { dirname, join, resolve } from "pathe";

const SKILL_DIR = "calca-design-exploration";

const packageRoot = (): string => {
  // dist/cli.mjs -> package root is one level up; src during development.
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(here, ".."), resolve(here, "..", ".."), resolve(here)];
  for (const dir of candidates) {
    if (existsSync(join(dir, "skills", SKILL_DIR, "SKILL.md"))) return dir;
  }
  consola.error(`cannot locate skills/${SKILL_DIR} relative to ${here}`);
  process.exit(1);
};

export const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description:
      "Print the path of the bundled agent skill (calca-design-exploration) or copy it to a directory",
  },
  args: {
    copy: {
      type: "string",
      description: "Copy the skill folder into this directory instead of printing the path",
    },
  },
  async run({ args }) {
    const source = join(packageRoot(), "skills", SKILL_DIR);
    if (!args.copy) {
      consola.log(source);
      consola.info(
        `Install: copy/link it as a skill, e.g. cp -r "${source}" ~/.claude/skills/ (claude-code), ~/.codex/skills/ (codex), or your host's skill directory.`,
      );
      return;
    }
    const target = join(resolve(args.copy), SKILL_DIR);
    await mkdir(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
    consola.success(`copied ${SKILL_DIR} to ${target}`);
  },
});
