# 0001 — Use Next.js App Router as Monolithic Framework

## Context and Problem Statement

Otto Canvas needs a web framework that supports both a rich interactive client-side canvas UI and server-side API routes that proxy requests to AI providers (Anthropic, Google Gemini, OpenAI). The application has no database, no user authentication, and no server-side rendering requirements—the canvas is entirely client-driven.

We need to choose a framework that minimizes development complexity while supporting both the interactive frontend and serverless API proxy needs.

## Decision Drivers

* **Development speed** — Solo developer, need rapid iteration
* **API route support** — Must proxy to external AI APIs without exposing keys to the client
* **Deployment simplicity** — Prefer zero-config deployment (Vercel)
* **React ecosystem** — Canvas UI built with React hooks and components
* **Streaming support** — AI generation benefits from streaming to avoid function timeouts

## Considered Options

* **Next.js App Router** — Full-stack React framework with API routes, streaming, and Vercel deployment
* **Vite + Express** — Separate frontend build tool and backend server
* **Remix** — Full-stack React framework with progressive enhancement focus
* **Plain React SPA + separate API server** — Complete separation of concerns

## Decision Outcome

Chosen option: **"Next.js App Router"**

### Consequences

* Good: Single framework for both UI and API routes — no CORS issues, no separate deployment
* Good: Vercel deployment with zero configuration, automatic serverless functions for API routes
* Good: Streaming API support via ReadableStream to keep connections alive and avoid Vercel function timeouts
* Good: Built-in TypeScript support and fast refresh for development
* Bad: API routes run as serverless functions with duration limits (max 300s on Pro plan), requiring workarounds (keepalive pings)
* Bad: App Router conventions (server components by default) add complexity for a purely client-side app — every component needs `"use client"` directive
* Bad: Tight coupling to Vercel's platform — API route behavior differs from standard Node.js servers
* Bad: Single monolithic page component (~1355 lines in `page.tsx`) emerges because there's no natural server/client boundary to enforce modularization
