import type { ElectrobunConfig } from "electrobun";

import { version } from "./package.json";

// CEF is only needed in dev mode for debugging; exclude from release builds to reduce package size
const isBuild = process.argv.some((arg) => arg === "build");

const isCI = process.env.CI === "true";

const cefFlags = {
  "remote-debugging-address": "127.0.0.1",
  "remote-debugging-port": process.env.ELECTROBUN_CDP_PORT ?? "9333",
};

const config: ElectrobunConfig = {
  app: {
    name: "Calca",
    identifier: "com.calca.desktop",
    version,
  },
  build: {
    buildFolder: "build",
    artifactFolder: "artifacts",
    mac: {
      icons: "calca.iconset",
      codesign: true,
      // CI notarizes by default; ELECTROBUN_NOTARIZE=false produces a signed but
      // unnotarized build (used as fallback when the Apple agreement/signing is
      // unavailable so releases still ship the .dmg).
      notarize: isCI && process.env.ELECTROBUN_NOTARIZE !== "false",
      bundleCEF: !isBuild,
      chromiumFlags: isBuild ? undefined : cefFlags,
    },
    win: {
      bundleCEF: false,
    },
    bun: {
      entrypoint: "src/index.ts",
    },
    copy: {
      "../../apps/web/dist": "views/web",
    },
    watch: ["../../apps/server/src"],
  },
  release: {
    baseUrl: "https://github.com/espetro/calca/releases/latest/download",
  },
};

export default config;
