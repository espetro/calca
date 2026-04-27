import type { ElectrobunConfig } from "electrobun";

const config: ElectrobunConfig = {
  app: {
    name: "Calca",
    identifier: "com.calca.desktop",
    version: "0.1.0",
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
      "../../apps/web/dist": "Resources/web",
      "../../apps/Resources/version.json": "Resources/version.json",
    },
  },
};

export default config;
