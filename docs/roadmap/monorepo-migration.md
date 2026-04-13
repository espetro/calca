# Monorepo Migration

| Attribute | Value |
|-----------|-------|
| Source | `docs/prd-v2.md` Section 6.1, `docs/decisions/0011-feature-sliced-design.md` |
| Priority | **P1** |
| Status | Planned — in transition |

## Description

Migrate from the current Feature-Sliced Design (`src/`) structure to a Bun workspace monorepo with `apps/`, `packages/`, and `platforms/` directories. This enables independent development of apps and packages, shared types across the codebase, and clearer boundaries for AI logic and database schemas.

## Dependencies

- **Shared Packages** — Required for AI-agnostic logic in core package
- **Database Package** — Required for schema and migrations
