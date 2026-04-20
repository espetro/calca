import { resolve } from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const gitHash = process.env.GIT_HASH ?? "";

export default defineConfig({
  plugins: [
    react(),
    tanstackRouter(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "./src") },
      {
        find: "@app/core",
        replacement: resolve(__dirname, "../../packages/core/src"),
      },
      {
        find: "@app/shared",
        replacement: resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@app/core", "@app/shared"],
  },
  define: {
    "import.meta.env.VITE_GIT_HASH": JSON.stringify(gitHash),
  },
  server: {
    port: 5173,
  },
});
