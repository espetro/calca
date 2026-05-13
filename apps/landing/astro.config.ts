import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import { version } from "./package.json";

export default defineConfig({
  integrations: [react()],
  output: "static",
  site: "https://calca.illo.fyi",
  base: "/",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    },
  },
});
