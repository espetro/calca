import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { paraglide } from "@inlang/paraglide-js-adapter-vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig, type Plugin } from "vite";

import { version } from "./package.json";

dotenv.config({ path: "../../.env" });

const __dirname = new URL(".", import.meta.url).pathname;

// The Tailwind v4 browser runtime for design frames ships with
// @calca/format-html-tailwind (package assets). Copy it into the public dir
// (served as /tailwindcss.js) and next to the export lib (inlined into
// standalone HTML via ?raw). Generated at dev start and on every build.
const RUNTIME_PKG = "@calca/format-html-tailwind";

const resolveRuntimeFile = (): string => {
  const candidates = [
    // Workspace link (bun/npm/yarn hoist the workspace package here).
    resolve(__dirname, "../node_modules", RUNTIME_PKG, "dist/assets/tailwindcss.js"),
    // Hoisted store copy.
    resolve(__dirname, "../../node_modules", RUNTIME_PKG, "dist/assets/tailwindcss.js"),
    // Monorepo root / sibling check (independent of node_modules layout).
    resolve(__dirname, "../../packages/format-html-tailwind", "dist/assets/tailwindcss.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `Tailwind runtime not found for ${RUNTIME_PKG}. Run \`bun run --cwd packages/format-html-tailwind assets\`.`,
  );
};

const copyFrameRuntimePlugin = (): Plugin => ({
  name: "calca-copy-frame-runtime",
  buildStart() {
    const runtime = resolveRuntimeFile();
    const publicTarget = resolve(__dirname, "public/tailwindcss.js");
    mkdirSync(dirname(publicTarget), { recursive: true });
    copyFileSync(runtime, publicTarget);
    const rawTarget = resolve(__dirname, "src/features/export/lib/tailwindcss.runtime.js");
    mkdirSync(dirname(rawTarget), { recursive: true });
    copyFileSync(runtime, rawTarget);
  },
});

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
          "vendor-react": ["react", "react-dom"],
          "vendor-tanstack": ["@tanstack/react-router", "@tanstack/react-query"],
          "vendor-ai": ["ai", "@ai-sdk/anthropic", "@ai-sdk/google"],
          "vendor-jotai": ["jotai"],
        },
      },
    },
  },
  plugins: [
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
    react(),
    tanstackRouter(),
    tailwindcss(),
    copyFrameRuntimePlugin(),
  ],
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
