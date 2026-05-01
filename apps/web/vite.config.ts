import { resolve } from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

import { version } from "./package.json";

dotenv.config({ path: "../../.env" });

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Auto-expose all VITE_* environment variables to the client bundle.
// Non-prefixed vars (e.g. LOG_LEVEL) must be mapped explicitly below.
const envDefine: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith("VITE_") && value !== undefined) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }
}

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-tanstack': ['@tanstack/react-router', '@tanstack/react-query'],
          'vendor-ai': ['ai', '@ai-sdk/anthropic', '@ai-sdk/google'],
          'vendor-jotai': ['jotai'],
        },
      },
    },
  },
  plugins: [react(), tanstackRouter(), tailwindcss()],
  resolve: {
    alias: [{ find: "#", replacement: resolve(__dirname, "./src") }],
  },
  define: {
    ...envDefine,
    // Explicit mappings for vars without the VITE_ prefix
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    "import.meta.env.VITE_GIT_HASH": JSON.stringify(process.env.GIT_HASH ?? ""),
    "import.meta.env.LOG_LEVEL": JSON.stringify(process.env.LOG_LEVEL ?? ""),
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
