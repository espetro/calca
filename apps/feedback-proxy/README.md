# Feedback Proxy

A Cloudflare Worker that accepts feedback submissions and posts comments to a GitHub Discussion.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/feedback` | Submit feedback → posts comment to Discussion #5 |

## Features

- **Rate limiting** — IP-based throttling via Cloudflare KV
- **Input validation** — Sanitizes and validates feedback payloads
- **CORS** — Restricts requests to `ALLOWED_ORIGIN`

## Local Development

```bash
# 1. Copy example secrets and fill in values
cp .dev.vars.example .dev.vars

# 2. Start local dev server
bun run dev:cf
```

## Deployment

```bash
# Create KV namespaces (first time only)
bunx wrangler kv namespace create RATE_LIMIT_KV --update-config
bunx wrangler kv namespace create RATE_LIMIT_KV --preview --update-config

# Set secrets
bunx wrangler secret put GITHUB_TOKEN
bunx wrangler secret put GITHUB_REPO
bunx wrangler secret put ALLOWED_ORIGIN

# Deploy
bun run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Personal access token with Discussions read/write permission (fine-grained PAT) |
| `GITHUB_REPO` | Target repository in `owner/repo` format |
| `ALLOWED_ORIGIN` | CORS origin (e.g., `https://calca.localhost`) |
