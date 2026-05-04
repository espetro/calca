import type { KVNamespace } from "@cloudflare/workers-types";

export interface FeedbackRequest {
  type: "bug" | "feature" | "feedback";
  title: string;
  description: string;
  email?: string;
  metadata?: object;
}

export interface FeedbackResponse {
  issueUrl: string;
  issueNumber: number;
}

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_KV: KVNamespace;
}

export type Bindings = Env;
