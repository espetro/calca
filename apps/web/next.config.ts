import type { NextConfig } from "next";
import { execSync } from "child_process";
import { resolve } from "path";
import { config } from "dotenv";

// Load .env files from repo root (monorepo pattern)
const repoRoot = resolve(__dirname, "../..");
config({ path: resolve(repoRoot, ".env") });
config({ path: resolve(repoRoot, ".env.local") });

let gitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
if (gitHash === "dev") {
  try {
    gitHash = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {}
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;
