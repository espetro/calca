import type { ElectrobunConfig } from "electrobun";

import { version } from "./package.json";

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
    },
    bun: {
      entrypoint: "src/index.ts",
    },
    copy: {
      "../../apps/web/dist": "Resources/app/web",
    },
    watch: ["../../apps/server/src"],
  },
  release: {
    baseUrl: "https://github.com/espetro/calca/releases/latest/download",
  },
};

export default config;
