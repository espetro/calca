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
    NEXT_PUBLIC_AI_BASE_URL: process.env.NEXT_PUBLIC_AI_BASE_URL || "",
    NEXT_PUBLIC_AI_API_KEY: process.env.NEXT_PUBLIC_AI_API_KEY || "",
    NEXT_PUBLIC_AI_MODEL: process.env.NEXT_PUBLIC_AI_MODEL || "",
  },
};

export default nextConfig;
