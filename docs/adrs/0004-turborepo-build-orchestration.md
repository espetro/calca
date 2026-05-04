# Turborepo Build Orchestration

## Metadata

- **Status**: Accepted
- **Date**: 2026-05-04
- **Decision makers**: Calca Engineering

## Context and Problem Statement

Calca is a Bun workspaces monorepo with multiple apps and packages that require coordinated build, test, and validation pipelines. The monorepo structure includes:

- `apps/web/` — Next.js frontend
- `apps/server/` — API server
- `apps/cli/` — CLI tool
- `apps/landing/` — Marketing site
- `packages/core/` — AI-agnostic logic
- `packages/shared/` — Types and contracts
- `packages/ui/` — Reusable UI components
- `platforms/desktop/` — Electrobun desktop wrapper
- `packages/config/`, `packages/logger/`, `packages/types/`, `packages/database/` — Supporting packages

With multiple packages and apps, running builds, tests, or type checks across the entire monorepo requires a tool that can:

- Execute tasks in parallel across packages
- Cache build outputs to avoid redundant work
- Model task dependency graphs (e.g., a package must build before dependents can typecheck)
- Provide consistent task orchestration across `dev`, `build`, `test`, `lint`, `typecheck`, and `validate`

## Decision Drivers

- **Build caching** — Avoid rebuilding unchanged packages on every change
- **Parallel execution** — Utilize all CPU cores across independent tasks
- **Task dependency graphs** — Respect `dependsOn` relationships (e.g., downstream packages must wait for upstream builds)
- **Incremental builds** — Only rebuild what changed, driven by file hashes and `outputs` globs
- **Cross-platform consistency** — Same behavior locally and in CI
- **Simplicity** — Minimal config footprint; no custom scripting

## Considered Options

- **Turborepo** — Purpose-built for monorepo task orchestration with remote and local caching, dependency graphs, and incremental builds
- **Nx** — Full-featured monorepo tool with caching, code generation, and dependency analysis, but with higher complexity and steeper learning curve
- **Plain npm scripts** — No caching, no dependency graph modeling; tasks run independently with no orchestration

## Decision Outcome

Chosen option: **"Turborepo"**

Turborepo is used for build orchestration and caching across the monorepo. Configuration lives in `turbo.json` at the repo root. The tool orchestrates the following task pipelines: `build`, `dev`, `typecheck`, `test`, `lint`, `format`, `validate`, and `clean`.

Turborepo was chosen because it provides the right balance of capability and simplicity: first-class task graph modeling, zero-config caching (file-hash-based), and native integration with Bun workspaces. It does not require a Java runtime or complex plugin systems, and the `turbo.json` schema is declarative and minimal.

Nx was ruled out due to its complexity overhead (code generation, plugin ecosystem, graph serialization) which exceeds the needs of a project at this scale.

Plain npm scripts were ruled out because they offer no caching and no dependency graph — every CI run rebuilds everything regardless of what changed.

## Consequences

- Good: Build cache dramatically reduces CI time and local iteration cycles by skipping packages whose inputs have not changed
- Good: Task dependency graph ensures correct ordering (e.g., `^build` means "wait for all upstream dependencies to build first")
- Good: `NODE_ENV`, `.env.local` files, and `dist/`/`build/` outputs are declared as cache invalidation inputs/outputs
- Good: `validate` task runs typecheck + lint + test in a single coordinated pipeline across all packages
- Bad: Turborepo adds a dependency and a tool to learn; new contributors need `bunx turbo` in their workflow
- Neutral: Remote caching (Turborepo Cloud) is optional — local caching is enabled by default and requires no account

## Validation

The decision is validated by:

- `turbo.json` exists at the repo root with a complete `tasks` map covering all pipeline stages
- `bun run dev` and `bun run build` complete successfully across all packages
- `bun run validate` (typecheck + lint + test) runs as a coordinated pipeline via `turbo validate`
- Build cache is active — unchanged packages are skipped on subsequent runs (verified via `turbo` output: `"Cache Miss"` vs `"Cache Hit"`)
- CI pipeline uses `turbo` to orchestrate builds, confirming the same behavior locally and in CI

## More Information

- [Turborepo documentation](https://turbo.build/repo/docs)
- [Bun workspaces](https://bun.sh/docs/install/workspaces)
- Current configuration: `turbo.json` at repo root
