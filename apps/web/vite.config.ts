import { resolve } from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

dotenv.config({ path: "../../.env" });

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const gitHash = process.env.GIT_HASH ?? "";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
  },
  plugins: [react(), tanstackRouter(), tailwindcss()],
  resolve: {
    alias: [{ find: "#", replacement: resolve(__dirname, "./src") }],
  },
  define: {
    "import.meta.env.VITE_GIT_HASH": JSON.stringify(gitHash),
    "import.meta.env.VITE_AI_BASE_URL": JSON.stringify(process.env.VITE_AI_BASE_URL ?? ""),
    "import.meta.env.VITE_AI_API_KEY": JSON.stringify(process.env.VITE_AI_API_KEY ?? ""),
    "import.meta.env.VITE_AI_MODEL": JSON.stringify(process.env.VITE_AI_MODEL ?? ""),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
