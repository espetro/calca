# Gosto v2 — Project Reset & Monorepo Rebuild

## TL;DR

> **Quick Summary**: Reset the project from the original `main` branch (Otto Canvas) and rebuild as a production-ready Bun/Turborepo monorepo with desktop-first MVP. Clean slate with POC as reference only.
> 
> **Deliverables**:
> - Original + POC analysis docs (PRD, MADRs)
> - Target v2 PRD + feature specs (OpenSpec)
> - Monorepo scaffolding (Bun workspaces + Turborepo)
> - Core MVP: Canvas + AI generation + pipeline + projects + export + settings + desktop shell
> - Tooling: AGENTS.md, Backlog.md, CI/CD, testing, release process, version management
> 
> **Estimated Effort**: XL (2-week sprint, ~15 parallel waves)
> **Parallel Execution**: YES — Pre-flight commit (sequential) then ALL remaining tasks via git worktrees
> **Critical Path**: Branding commit → Analysis (parallel, worktrees) → Monorepo setup → Shared contracts → Server/Web/Desktop skeletons → Features → Integration

---

## Pre-Flight: Branding + License Change (SEQUENTIAL — VERY FIRST COMMIT)

> This MUST be the first commit on a fresh branch from `main`. All subsequent work branches off from here.

**Branch**: Create `develop` from `main` (commit `015ad63`), then work on `develop`.

- [ ] 0. Branding + License Change — VERY FIRST COMMIT

  **What to do**:
  - Create branch `develop` from `main` (commit `015ad63`)
  - Replace ALL "Otto" / "otto" / "otto-canvas" branding with "Gosto" / "gosto":
    - `package.json` → name: "gosto", description updated
    - `README.md` → Updated for Gosto branding
    - All component references, titles, headers
    - Settings modal references
    - Any user-facing strings
  - Change license from MIT to AGPLv3:
    - Replace `LICENSE` file with AGPLv3 full text
    - Update `package.json` license field to `"AGPL-3.0-only"`
  - Update `package.json`:
    - `name`: `"gosto"`
    - `description`: `"AI design tool with infinite canvas — vibe coding for design"`
    - `license`: `"AGPL-3.0-only"`
    - `author`: Your name/info
  - This is the ONLY sequential commit. Everything after this runs in parallel via git worktrees.

  **Must NOT do**:
  - Do NOT change any code architecture or features
  - Do NOT add/modify dependencies
  - Do NOT touch any logic — ONLY branding strings + license file

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO — MUST be first commit
  - **Blocks**: ALL other tasks
  - **Blocked By**: None

  **References**:
  - `package.json` — Contains `name: "otto-canvas"`, `license: "MIT"`, `author: "Stratus Labs LLC"`
  - `README.md` — Title "Canvas by Otto", references to Otto throughout
  - `LICENSE` — Current MIT license text
  - `src/components/settings-modal.tsx` — Likely has Otto references
  - `src/app/layout.tsx` — Page title references

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No Otto branding remains
    Tool: Bash
    Preconditions: Branding commit applied
    Steps:
      1. Search for remaining Otto: `grep -ri "otto\|Otto" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.css" . | grep -v node_modules | grep -v .git | grep -v .sisyphus || echo "CLEAN"`
      2. Verify gosto branding: `grep -ri "gosto\|Gosto" package.json README.md`
    Expected Result: No Otto references remain, Gosto branding present
    Evidence: .sisyphus/evidence/task-0-branding.txt

  Scenario: License is AGPLv3
    Tool: Bash
    Steps:
      1. Check LICENSE: `head -5 LICENSE | grep "AGPL\|GNU AFFERO"`
      2. Check package.json: `grep '"license"' package.json`
    Expected Result: LICENSE file has AGPL text, package.json shows AGPL-3.0-only
    Evidence: .sisyphus/evidence/task-0-license.txt
  ```

  **Commit**: YES — THIS IS THE VERY FIRST COMMIT
  - Message: `chore: rebrand Otto → Gosto and change license to AGPLv3`
  - Files: `package.json`, `README.md`, `LICENSE`, all files with Otto references
  - Pre-commit: `grep -ri "otto" --include="*.ts" --include="*.tsx" --include="*.json" . | grep -v node_modules`

---

## Execution Strategy

### Parallel Execution Waves

> After the branding commit (Task 0), ALL work happens via git worktrees in parallel waves.
> Each task gets its own worktree branch. Task results are merged back to `develop`.
> All tasks MUST be registered in Backlog.md before work begins.

```
Pre-flight (SEQUENTIAL — must complete first):
└── Task 0: Branding + License change [quick] → FIRST COMMIT on develop

Wave 1 (Start after Task 0 — analysis + documentation, PARALLEL via worktrees):
├── Task 1: Analyze original codebase → PRD + MADRs [deep]
├── Task 2: Analyze POC changes → PRD + MADRs + learnings [deep]
└── Task 3: Write v2 target PRD + OpenSpec + Backlog.md setup [writing]

Wave 2 (After Wave 1 — monorepo scaffolding):
├── Task 4: Initialize Bun workspace monorepo + Turborepo [quick]
├── Task 4b: Set up version management + conventional commits (depends: 4) [quick]
├── Task 5: Set up packages/shared (contracts, schemas, types, constants) [unspecified-high]
├── Task 6: Set up shared configs (tsconfig, oxlint, oxfmt, vitest) [quick]
├── Task 7: Initialize AGENTS.md with progressive disclosure [writing]
└── Task 8: Initialize Backlog.md with MVP tasks [quick]

Wave 3 (After Wave 2 — app skeletons):
├── Task 9: Scaffold apps/server (Hono + Drizzle + Mastra + file contracts) [unspecified-high]
├── Task 10: Scaffold apps/web (TanStack Start + React Flow + shadcn/ui + file contracts) [unspecified-high]
├── Task 11: Scaffold packages/desktop (Electrobun shell) [unspecified-high]
├── Task 12: Write initial MADRs for v2 architecture decisions [writing]
└── Task 13: Set up CI/CD (GitHub Actions) + release branching [unspecified-high]

Wave 4 (After Wave 3 — core features):
├── Task 14: Implement AI generation pipeline (Mastra workflow) [deep]
├── Task 15: Implement canvas feature (React Flow + design nodes) [visual-engineering]
├── Task 16: Implement project management feature (CRUD + SQLite) [unspecified-high]
├── Task 17: Implement export feature (Tailwind, React, SVG) [unspecified-high]
├── Task 18: Implement settings feature (BYOK + model selection) [quick]
└── Task 19: Wire desktop shell (Electrobun → server → web) [deep]

Wave 5 (After Wave 4 — integration + polish):
├── Task 20: Integration: desktop app end-to-end flow [deep]
├── Task 21: UI polish + dark mode + responsive canvas [visual-engineering]
└── Task 22: Final testing + coverage enforcement + bug fixes [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1/T2 → T3 → T4 → T4b → T5 → T9/T10 → T14 → T19 → T20 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 2 with 4b + Wave 4)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 3 | 1 |
| 2 | — | 3 | 1 |
| 3 | 1, 2 | 4, 12 | 1 |
| 4 | 3 | 4b | 2 |
| 4b | 4 | 5, 6, 7, 8 | 2 |
| 5 | 4b | 9, 10 | 2 |
| 6 | 4b | 9, 10, 11 | 2 |
| 7 | 4b | — | 2 |
| 8 | 3, 4b | — | 2 |
| 9 | 5, 6 | 14, 16, 17, 18 | 3 |
| 10 | 5, 6 | 15, 17 | 3 |
| 11 | 4b | 19 | 3 |
| 12 | 3 | — | 3 |
| 13 | 4b | — | 3 |
| 14 | 9 | 20 | 4 |
| 15 | 10 | 20 | 4 |
| 16 | 9 | 20 | 4 |
| 17 | 9, 10 | 20 | 4 |
| 18 | 9, 10 | 20 | 4 |
| 19 | 11 | 20 | 4 |
| 20 | 14-19 | F1-F4 | 5 |
| 21 | 15 | F1-F4 | 5 |
| 22 | 14-19 | F1-F4 | 5 |

### Agent Dispatch Summary

- **Wave 1**: 3 — T1 → `deep`, T2 → `deep`, T3 → `writing`
- **Wave 2**: 6 — T4 → `quick`, T4b → `quick`, T5 → `unspecified-high`, T6 → `quick`, T7 → `writing`, T8 → `quick`
- **Wave 3**: 5 — T9 → `unspecified-high`, T10 → `unspecified-high`, T11 → `unspecified-high`, T12 → `writing`, T13 → `unspecified-high`
- **Wave 4**: 6 — T14 → `deep`, T15 → `visual-engineering`, T16 → `unspecified-high`, T17 → `unspecified-high`, T18 → `quick`, T19 → `deep`
- **Wave 5**: 3 — T20 → `deep`, T21 → `visual-engineering`, T22 → `unspecified-high`
- **FINAL**: 4 — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Analyze Original Codebase → PRD + MADRs

  **What to do**:
  - Check out the `main` branch state (commit `015ad63`)
  - Analyze all features, architecture, tech stack, API surface, data layer
  - Write `docs/prd-original.md` — Product Requirements Document for the original Otto Canvas app
    - Cover: Problem Statement, Target Users, User Stories (from README features), Functional Requirements, Non-Functional Requirements, Technical Considerations, Out of Scope
  - Write initial MADRs in `docs/decisions/`:
    - `0001-original-nextjs-monolith.md` — Why Next.js App Router was chosen
    - `0002-original-anthropic-only.md` — Why single AI provider
    - `0003-original-localstorage-persistence.md` — Why client-side storage
  - Create `docs/decisions/adr-template.md` using MADR 3.x format

  **Must NOT do**:
  - Do NOT modify any source code files
  - Do NOT change branches or git state permanently

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires thorough codebase analysis and documentation writing
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `writing`: The output IS writing, but the primary task is deep code analysis

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/page.tsx` — Main 1355-line page component (core features in one file)
  - `src/app/api/pipeline/layout/route.ts` — AI layout generation pipeline (350 lines)
  - `src/app/api/pipeline/review/route.ts` — Visual QA pipeline stage
  - `src/app/api/pipeline/critique/route.ts` — Critique generation
  - `src/app/api/export/route.ts` — Export functionality
  - `src/lib/types.ts` — Core type definitions (Point, DesignIteration, Comment, etc.)
  - `src/lib/pipeline.ts` — Pipeline stage definitions
  - `src/components/design-card.tsx` — Design rendering component (iframe-based)
  - `src/components/prompt-bar.tsx` — Prompt input UI
  - `src/hooks/use-canvas.ts` — Canvas pan/zoom logic
  - `src/hooks/use-settings.ts` — Settings persistence (localStorage)
  - `src/hooks/use-persisted-groups.ts` — Design group persistence
  - `README.md` — Feature list and documentation

  **External References**:
  - MADR 3.x template: https://github.com/adr/madr/blob/develop/template/adr-template.md

  **WHY Each Reference Matters**:
  - `page.tsx`: Contains ALL original features — extract user stories from this
  - `api/pipeline/*`: Maps to the multi-model AI pipeline — document each stage
  - `types.ts`: Domain model — extract entities and relationships
  - `README.md`: Authoritative feature list for PRD user stories

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Original PRD is comprehensive
    Tool: Bash
    Preconditions: docs/prd-original.md exists
    Steps:
      1. Check file exists: `test -f docs/prd-original.md && echo "EXISTS"`
      2. Verify key sections present: `grep -c "Problem Statement\|User Stories\|Functional Requirements\|Out of Scope" docs/prd-original.md`
      3. Verify user stories count ≥ 10: `grep -c "US-" docs/prd-original.md`
    Expected Result: File exists, all sections present, ≥10 user stories documented
    Evidence: .sisyphus/evidence/task-1-prd-original.txt

  Scenario: MADRs follow MADR 3.x format
    Tool: Bash
    Preconditions: docs/decisions/ directory has .md files
    Steps:
      1. List MADRs: `ls docs/decisions/*.md`
      2. Verify format: `grep -l "Context and Problem Statement\|Considered Options\|Decision Outcome" docs/decisions/000*.md | wc -l`
    Expected Result: ≥ 3 MADR files, all with required sections
    Evidence: .sisyphus/evidence/task-1-madrs.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `docs(analysis): add original and POC PRDs and MADRs`
  - Files: `docs/prd-original.md`, `docs/decisions/`
  - Pre-commit: `test -f docs/prd-original.md`

- [ ] 2. Analyze POC Changes → PRD + MADRs + Learnings

  **What to do**:
  - Analyze the diff between `main` and `main-latest` (492 files, +57,351/-8,159)
  - Extract POC's PRD — what it was trying to build
  - Write `docs/prd-poc.md` — PRD for the POC (what was implemented, what worked, what didn't)
  - Write POC-specific MADRs in `docs/decisions/`:
    - `0004-poc-monorepo-turborepo.md` — Why monorepo with Turborepo
    - `0005-poc-hono-server.md` — Why Hono over Next.js API routes
    - `0006-poc-react-flow-canvas.md` — Why React Flow over custom canvas
    - `0007-poc-sqlite-drizzle.md` — Why SQLite + Drizzle over localStorage
    - `0008-poc-mastra-ai.md` — Why Mastra over direct SDK calls
  - Write `docs/poc-learnings.md` — What worked, what didn't, what to carry forward
  - Write `docs/prd-v2-delta.md` — Diff between original PRD + POC PRD → v2 target

  **Must NOT do**:
  - Do NOT modify any source code files
  - Do NOT merge POC code into main

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Deep analysis of 259 commits and 492 changed files
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (POC codebase at main-latest):
  - `apps/server/src/index.ts` — Hono server entry point
  - `apps/server/src/routes/` — API routes structure
  - `apps/web/src/` — Vite + TanStack Router frontend
  - `packages/core/src/` — AI-agnostic logic (prompts, parsers)
  - `packages/database/drizzle/schema.ts` — Drizzle schema definition
  - `platforms/desktop/` — Electrobun desktop app
  - `turbo.json` — Turborepo build configuration
  - `AGENTS.md` — Existing architecture documentation

  **External References**:
  - MADR 3.x template: https://github.com/adr/madr/blob/develop/template/adr-template.md

  **WHY Each Reference Matters**:
  - `apps/server/`: Shows Hono API architecture — document why this replaced Next.js routes
  - `packages/database/`: Shows Drizzle schema — document persistence decisions
  - `platforms/desktop/`: Shows Electrobun integration — document desktop wrapper pattern
  - `AGENTS.md`: Has existing architecture notes — extract learnings

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: POC PRD captures all POC features
    Tool: Bash
    Preconditions: docs/prd-poc.md exists
    Steps:
      1. Check file: `test -f docs/prd-poc.md && echo "EXISTS"`
      2. Verify POC-specific sections: `grep -c "Monorepo\|Hono\|React Flow\|Drizzle\|Mastra\|Electrobun" docs/prd-poc.md`
    Expected Result: File exists with ≥ 6 POC-specific technology references
    Evidence: .sisyphus/evidence/task-2-prd-poc.txt

  Scenario: POC learnings document is actionable
    Tool: Bash
    Preconditions: docs/poc-learnings.md exists
    Steps:
      1. Check for "What Worked" and "What Didn't" sections
      2. Verify actionable items: `grep -c "CARRY\|SKIP\|REDESIGN" docs/poc-learnings.md`
    Expected Result: Learnings doc with clear carry/skip/redesign verdicts
    Evidence: .sisyphus/evidence/task-2-learnings.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `docs(analysis): add original and POC PRDs and MADRs`
  - Files: `docs/prd-poc.md`, `docs/poc-learnings.md`, `docs/prd-v2-delta.md`, `docs/decisions/`
  - Pre-commit: `test -f docs/prd-poc.md`

- [ ] 3. Write v2 Target PRD + OpenSpec + Backlog.md Setup

  **What to do**:
  - Based on Tasks 1+2 analysis, write `docs/prd-v2.md` — the target PRD for the rebuild
    - Include: vision, MVP scope (8 features), post-MVP roadmap, technical stack, file contracts reference
    - Reference `docs/architecture-plan.md` as the authoritative architecture doc
    - Define P0 (MVP) vs P1 (post-MVP) priorities
  - Initialize OpenSpec: `bun x openspec init` (or create `openspec/` directory structure)
    - Create `openspec/config.yaml` with project settings
    - Create initial change specs for MVP features
  - Initialize Backlog.md: `backlog init "Gosto"`
    - Create MVP tasks for each of the 8 features
    - Create post-MVP tasks as backlog items
    - Set up DoD (Definition of Done) defaults
  - Set up `backlog mcp start` for MCP integration
  - Write `docs/decisions/0009-v2-mastra-workflows-over-effect.md` — MADR for Mastra choice

  **Must NOT do**:
  - Do NOT start implementing features (documentation only)
  - Do NOT install packages beyond initialization tools

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: PRD writing, spec creation, and documentation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (but needs Task 1+2 results to be complete)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2) — starts after T1+T2 complete
  - **Blocks**: Tasks 4, 12
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md` — AUTHORITATIVE file contract reference for v2
  - `README.md` — Original product description and feature list
  - `docs/prd-original.md` — Task 1 output (original PRD)
  - `docs/prd-poc.md` — Task 2 output (POC PRD)
  - `docs/poc-learnings.md` — Task 2 output (carry/skip/redesign)

  **External References**:
  - OpenSpec docs: https://github.com/Fission-AI/OpenSpec
  - Backlog.md docs: https://github.com/MrLesk/Backlog.md
  - MADR template: https://github.com/adr/madr

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: This IS the v2 architecture — PRD must reference it as contract
  - Original + POC PRDs: Delta analysis to identify gaps and target scope
  - POC learnings: Carry/skip/redesign decisions feed into v2 PRD priorities

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: v2 PRD covers all 8 MVP features
    Tool: Bash
    Preconditions: docs/prd-v2.md exists
    Steps:
      1. Check file: `test -f docs/prd-v2.md && echo "EXISTS"`
      2. Verify MVP features: `grep -c "canvas\|AI generation\|pipeline\|project management\|export\|settings\|desktop shell\|SQLite persistence" docs/prd-v2.md`
      3. Verify P0/P1 split: `grep -c "P0\|P1\|MVP\|post-MVP" docs/prd-v2.md`
    Expected Result: File exists with all 8 features and P0/P1 priority split
    Evidence: .sisyphus/evidence/task-3-prd-v2.txt

  Scenario: Backlog.md initialized with tasks
    Tool: Bash
    Preconditions: backlog/ directory initialized
    Steps:
      1. Check backlog init: `test -d backlog && echo "EXISTS"`
      2. List tasks: `backlog task list --plain 2>/dev/null | head -20`
    Expected Result: backlog/ exists with initial MVP tasks
    Evidence: .sisyphus/evidence/task-3-backlog.txt

  Scenario: OpenSpec directory initialized
    Tool: Bash
    Preconditions: openspec/ directory exists
    Steps:
      1. Check config: `test -f openspec/config.yaml && echo "EXISTS"`
      2. Verify structure: `ls openspec/`
    Expected Result: openspec/ with config.yaml and changes/ directory
    Evidence: .sisyphus/evidence/task-3-openspec.txt
  ```

  **Commit**: YES
  - Message: `docs: add v2 PRD, OpenSpec config, and Backlog.md setup`
  - Files: `docs/prd-v2.md`, `openspec/`, `backlog/`, `docs/decisions/0009-v2-mastra-workflows.md`
  - Pre-commit: `test -f docs/prd-v2.md && test -f openspec/config.yaml`

- [ ] 4. Initialize Bun Workspace Monorepo + Turborepo

  **What to do**:
  - Create root `package.json` with Bun workspaces: `["apps/*", "packages/*"]`
  - Install and configure Turborepo: `turbo.json` with build/dev/test/validate tasks
  - Create workspace directories:
    - `apps/web/`, `apps/server/`, `apps/cli/`, `apps/landing/`
    - `packages/shared/`, `packages/desktop/`
  - Create placeholder `package.json` for each workspace
  - Set up root `bunfig.toml`
  - Configure `turbo.json`:
    - `build`: `dependsOn: ["^build"]`, outputs: `["dist/**"]`
    - `dev`: `cache: false`, `persistent: true`
    - `typecheck`: `dependsOn: ["^build"]`
    - `test`: `dependsOn: ["^build"]`
    - `lint`: depends on build
    - `validate`: parallel composition of format+lint+typecheck+test
  - Set up `.gitignore` for monorepo (dist/, .turbo/, node_modules/, *.db)
  - Run `bun install` and verify all workspaces resolve

  **Must NOT do**:
  - Do NOT copy code from POC branches
  - Do NOT configure app-specific frameworks yet (that's Wave 3)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding and configuration — well-defined setup steps
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential within this task, enables all Wave 2 tasks)
  - **Blocks**: Tasks 5, 6, 7, 8
  - **Blocked By**: Task 3

  **References**:

  **Pattern References** (POC as reference):
  - POC root `package.json` — Workspace configuration pattern
  - POC `turbo.json` — Turborepo task configuration
  - POC `bun.lock` — Expected lockfile format

  **External References**:
  - Turborepo docs: https://turbo.build/repo/docs
  - Bun workspaces: https://bun.sh/docs/install/workspaces

  **WHY Each Reference Matters**:
  - POC turbo.json: Proven configuration — replicate the task structure
  - Bun workspaces docs: Ensure correct workspace: [] syntax

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Monorepo installs and resolves all workspaces
    Tool: Bash
    Preconditions: Root package.json with workspaces configured
    Steps:
      1. Run `bun install`
      2. Verify workspaces: `bun run --filter '*' -- bun --version 2>/dev/null || echo "workspaces ok"`
      3. Check bun.lock exists: `test -f bun.lock && echo "EXISTS"`
      4. Verify workspace count: `ls -d apps/* packages/* | wc -l`
    Expected Result: bun install succeeds, lockfile exists, 6+ workspaces detected
    Failure Indicators: Install errors, missing lockfile, workspace not found
    Evidence: .sisyphus/evidence/task-4-monorepo-install.txt

  Scenario: Turborepo tasks are configured
    Tool: Bash
    Preconditions: turbo.json exists
    Steps:
      1. Check turbo.json: `test -f turbo.json && echo "EXISTS"`
      2. Verify task definitions: `grep -c "build\|dev\|typecheck\|test\|lint\|validate" turbo.json`
    Expected Result: turbo.json with ≥6 task definitions
    Evidence: .sisyphus/evidence/task-4-turbo-config.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `chore: initialize bun workspace monorepo with turborepo`
  - Files: `package.json`, `turbo.json`, `bunfig.toml`, `.gitignore`, `apps/*/package.json`, `packages/*/package.json`
  - Pre-commit: `bun install`

- [ ] 4b. Set Up Version Management + Conventional Commits

  **What to do**:
  - Install and configure `@changesets/cli` for monorepo versioning:
    - `bun add -D @changesets/cli @changesets/changelog-md`
    - `bunx changeset init` → creates `.changeset/` directory
    - Configure `.changeset/config.json`:
      - `"version": "0.1.0"` (baseline for all packages)
      - `"changelog": "@changesets/changelog-md"`
      - `"access": "restricted"` (private monorepo)
      - `"linked": [[]]` (all packages version independently for now)
      - `"baseBranch": "develop"`
    - Set `"version": "0.1.0"` on ALL workspace `package.json` files (root, apps/*, packages/*)
  - Create initial `CHANGELOG.md` with `# 0.1.0 — Project Reset` entry
  - Install and configure conventional commit enforcement:
    - `bun add -D @commitlint/cli @commitlint/config-conventional`
    - Create `commitlint.config.ts` extending `@commitlint/config-conventional`
    - Configure allowed scopes: `server, web, desktop, shared, config, desktop, docs, ci, core`
  - Set up git hooks:
    - `bun add -D simple-git-hooks lint-staged`
    - Configure `simple-git-hooks` in `package.json`:
      - `pre-commit`: `lint-staged` (runs oxfmt + oxlint on staged files)
      - `commit-msg`: `bunx commitlint --edit $1`
    - Configure `lint-staged` in `package.json`:
      - `*.{ts,tsx}`: `oxlint --fix`, `oxfmt --write`
      - Run `bunx simple-git-hooks` to activate hooks
  - Add version workflow scripts to root `package.json`:
    - `"version:patch"`: changeset version (bump patch)
    - `"version:minor"`: changeset pre enter minor (or manual changeset)
    - `"changeset"`: changeset (interactive — author changeset files)
    - `"version"`: changeset version (apply pending changesets)
  - Document the versioning workflow:
    - Write `docs/versioning.md` explaining:
      1. After squash-merging a task branch into `develop`: run `bun changeset` to describe the change
      2. Run `bun version` to apply version bumps
      3. For releases: bump is already done, tag with `git tag v0.X.0`
    - Include squash merge commands as the canonical workflow

  **Must NOT do**:
  - Do NOT publish packages to npm (private monorepo)
  - Do NOT set up auto-versioning from CI (manual changeset authoring)
  - Do NOT configure `changeset` `fixed` mode (packages version independently)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration and tooling setup — well-defined steps with no architectural decisions
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `writing`: The docs/versioning.md is small and secondary — primary task is config

  **Parallelization**:
  - **Can Run In Parallel**: NO — must run immediately after Task 4, before Tasks 5-8
  - **Parallel Group**: Wave 2 (sequential: T4 → T4b → T5-T8 parallel)
  - **Blocks**: Tasks 5, 6, 7, 8
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - Task 4 output: root `package.json` with workspaces, all workspace `package.json` files
  - POC `.changeset/config.json` — Reference for changeset config structure (if exists)

  **External References**:
  - Changesets docs: https://github.com/changesets/changesets
  - simple-git-hooks: https://github.com/toplenboren/simple-git-hooks
  - lint-staged: https://github.com/lint-staged/lint-staged
  - commitlint: https://commitlint.js.org/

  **WHY Each Reference Matters**:
  - Changesets docs: Configuration options for monorepo versioning
  - simple-git-hooks: Bun-compatible git hooks (not husky which is Node-centric)
  - commitlint: Conventional commit enforcement config

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Changesets configured and initialized
    Tool: Bash
    Preconditions: .changeset/ directory exists
    Steps:
      1. Check config: `test -f .changeset/config.json && echo "EXISTS"`
      2. Verify changelog config: `grep "changelog" .changeset/config.json`
      3. Verify base branch: `grep "develop" .changeset/config.json`
      4. Check all packages have version: `grep '"version"' apps/*/package.json packages/*/package.json package.json | wc -l`
    Expected Result: Config exists with changelog enabled, base branch "develop", all packages at "0.1.0"
    Failure Indicators: Missing config, no version fields, wrong base branch
    Evidence: .sisyphus/evidence/task-4b-changesets.txt

  Scenario: Conventional commits enforced via commitlint
    Tool: Bash
    Preconditions: commitlint configured, git hooks active
    Steps:
      1. Test bad commit message: `echo "bad message" | bunx commitlint`
      2. Test good commit message: `echo "feat(server): add endpoint" | bunx commitlint`
    Expected Result: Bad message rejected, good message accepted
    Evidence: .sisyphus/evidence/task-4b-commitlint.txt

  Scenario: Git hooks are active
    Tool: Bash
    Preconditions: simple-git-hooks installed and initialized
    Steps:
      1. Check hooks: `ls .git/hooks/ | grep -E "pre-commit|commit-msg"`
      2. Verify package.json config: `grep "simple-git-hooks" package.json`
    Expected Result: pre-commit and commit-msg hooks exist in .git/hooks/
    Evidence: .sisyphus/evidence/task-4b-hooks.txt

  Scenario: CHANGELOG.md exists with initial entry
    Tool: Bash
    Steps:
      1. Check file: `test -f CHANGELOG.md && echo "EXISTS"`
      2. Verify initial entry: `grep "0.1.0" CHANGELOG.md`
    Expected Result: CHANGELOG.md with 0.1.0 entry
    Evidence: .sisyphus/evidence/task-4b-changelog.txt
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `chore: set up version management with changesets and conventional commits`
  - Files: `.changeset/`, `CHANGELOG.md`, `commitlint.config.ts`, `docs/versioning.md`, `package.json` (hooks + scripts)
  - Pre-commit: `bunx commitlint --edit .git/COMMIT_EDITMSG` (validates this very commit)

- [ ] 5. Set Up packages/shared (Contracts, Schemas, Types, Constants)

  **What to do**:
  - Create `packages/shared/src/` with full structure per architecture-plan.md:
    - `schemas/` — Zod schemas with DB, Public, Create variants via `.omit/.pick`
    - `contracts/` — `ServerFeature`, `UIFeature`, IPC type definitions
    - `constants/` — Route strings (`/api/<feature>`), error code enums
    - `utils/` — Pure functions only (formatting, dates)
    - `index.ts` — Full public barrel export
  - Define core domain schemas (from original's `src/lib/types.ts`):
    - `project.schema.ts` — Project CRUD types
    - `design.schema.ts` — DesignIteration, DesignGroup types
    - `settings.schema.ts` — Settings (API keys, model selection)
    - `generation.schema.ts` — AI generation request/response types
    - `export.schema.ts` — Export format types
    - `canvas.schema.ts` — Canvas node/edge position types
  - Define `ServerFeature` and `UIFeature` contract interfaces
  - Define IPC message types for Electrobun desktop communication
  - Configure `tsconfig.json` with `composite: true` for project references
  - Write initial unit tests for schema validation

  **Must NOT do**:
  - Do NOT import React, Hono, Drizzle, or any package with side effects
  - Do NOT put business logic in shared — contracts only
  - Do NOT use runtime dependencies beyond Zod

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Type system design + Zod schemas — high effort, needs precision
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Task 4b

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:94-209` — AUTHORITATIVE: shared package structure, schema pattern, ServerFeature/UIFeature interfaces, import rules
  - `src/lib/types.ts` — Original type definitions (Point, DesignIteration, Comment, GenerationGroup, CanvasImage, ToolMode, PipelineStage)
  - POC `packages/types/` — POC type organization (for reference, NOT copy)

  **API/Type References**:
  - `src/lib/pipeline.ts` — Pipeline stage enum and types

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: This IS the contract — follow it exactly
  - `types.ts`: Original domain model — extract entities into Zod schemas
  - `pipeline.ts`: Pipeline stages need to be in shared contracts

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Shared package builds and exports correctly
    Tool: Bash
    Preconditions: packages/shared/ fully structured
    Steps:
      1. Run `turbo build --filter=@app/shared`
      2. Check exports: `bun -e "import { ServerFeature, UIFeature } from './packages/shared/src/index'; console.log('OK')"`
      3. Verify no side-effect imports: `grep -r "from 'react\|from 'hono\|from 'drizzle" packages/shared/src/ || echo "CLEAN"`
    Expected Result: Build succeeds, contracts exportable, no side-effect imports
    Evidence: .sisyphus/evidence/task-5-shared-build.txt

  Scenario: Zod schemas validate correctly
    Tool: Bash
    Preconditions: Schema files exist
    Steps:
      1. Run tests: `turbo test --filter=@app/shared`
      2. Verify schema count: `ls packages/shared/src/schemas/*.schema.ts | wc -l`
    Expected Result: All tests pass, ≥5 schema files
    Evidence: .sisyphus/evidence/task-5-shared-tests.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(shared): add contracts, schemas, types, and constants`
  - Files: `packages/shared/`
  - Pre-commit: `turbo build --filter=@app/shared && turbo test --filter=@app/shared`

- [ ] 6. Set Up Shared Configs (tsconfig, oxlint, oxfmt, vitest)

  **What to do**:
  - Create `packages/config/` with shared configuration:
    - `tsconfig/base.json` — Base TypeScript config (strict, ESNext target)
    - `tsconfig/bun.json` — Extends base for Bun runtime apps (server, cli)
    - `tsconfig/vite.json` — Extends base for Vite apps (web, landing)
    - `tsconfig/library.json` — Extends base for library packages (shared)
  - Create root `.oxlintrc.json` with linting rules
  - Create root `.oxfmtrc.json` with formatting rules
  - Create `vitest.workspace.ts` for monorepo-wide test configuration
  - Create root `vitest.config.ts` with shared test settings (coverage thresholds)
  - Configure TypeScript project references between packages
  - Create `scripts/validate.ts` — custom validation runner with clean output:
    - Runs 4 checks sequentially: oxlint, oxfmt (`--check`), tsc (`--noEmit`), vitest (`run`)
    - Captures each command's exit code + stderr
    - Prints `✅ lint` / `✅ format` / `✅ types` / `✅ tests` on success
    - On failure: prints `❌ <check>` then error lines only (stripped stack traces, file:line + message)
    - Exits 0 only if all 4 pass; exits 1 on first failure (fail-fast)
    - Uses `Bun.spawnSync` for subprocess execution with `stderr: "pipe"`
    - Error formatting: extract file path + line number + message, omit node_modules internals and stack frames
  - Add `"validate": "bun scripts/validate.ts"` to root `package.json` scripts
  - Verify: `bun validate` runs and produces clean ✅ output (even with empty apps/tests)
  - Verify: `turbo typecheck` passes (even with empty apps)

  **Must NOT do**:
  - Do NOT install ESLint/Prettier (oxlint/oxfmt instead)
  - Do NOT add app-specific configs (those go in each app)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration file creation — straightforward setup
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Tasks 9, 10, 11
  - **Blocked By**: Task 4b

  **References**:

  **Pattern References** (POC as reference):
  - POC `packages/config/tsconfig/` — Shared TypeScript configs
  - POC `.oxlintrc.json` — Oxlint rules
  - POC `.oxfmtrc.json` — Oxfmt rules
  - POC `vitest.workspace.ts` — Vitest workspace config
  - POC `tsconfig.core.json` — Core TS config

  **WHY Each Reference Matters**:
  - POC configs: Proven configuration that worked — replicate the structure

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TypeScript configs resolve correctly
    Tool: Bash
    Preconditions: packages/config/ created
    Steps:
      1. Check tsconfig files: `ls packages/config/tsconfig/*.json | wc -l`
      2. Verify extends chain: `grep "extends" packages/config/tsconfig/bun.json`
    Expected Result: ≥3 tsconfig variants, all extending base
    Evidence: .sisyphus/evidence/task-6-configs.txt

  Scenario: Vitest workspace config valid
    Tool: Bash
    Preconditions: vitest.workspace.ts exists
    Steps:
      1. Check file: `test -f vitest.workspace.ts && echo "EXISTS"`
      2. Validate: `bun -e "import './vitest.workspace'; console.log('OK')" 2>&1 || echo "syntax ok"`
    Expected Result: vitest.workspace.ts exists and is syntactically valid
    Evidence: .sisyphus/evidence/task-6-vitest.txt

  Scenario: Validate script produces clean success output
    Tool: Bash
    Preconditions: All tooling configured, scripts/validate.ts exists
    Steps:
      1. Run: `bun validate`
      2. Verify output contains exactly: `✅ lint`, `✅ format`, `✅ types`, `✅ tests`
      3. Verify exit code: `bun validate; echo "EXIT:$?"`
    Expected Result: Exit 0, output shows 4 green checkmarks with check names only
    Failure Indicators: Exit non-zero, verbose output with stack traces, missing check marks
    Evidence: .sisyphus/evidence/task-6-validate-success.txt

  Scenario: Validate script shows clean errors on failure
    Tool: Bash
    Preconditions: scripts/validate.ts exists
    Steps:
      1. Introduce a type error: `echo "const x: string = 42" >> packages/shared/src/index.ts`
      2. Run: `bun validate`
      3. Verify output has `❌ types` with file:line + error message, NO stack trace
      4. Verify output does NOT contain `at ` (stack frame prefix) or `node_modules`
      5. Clean up: revert the introduced error
    Expected Result: `❌ types` shown with concise error, no stack traces or noise
    Failure Indicators: Stack traces visible, verbose output, multiple screenfuls of text
    Evidence: .sisyphus/evidence/task-6-validate-failure.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `chore: add shared configs (tsconfig, oxlint, oxfmt, vitest) + validate script`
  - Files: `packages/config/`, `.oxlintrc.json`, `.oxfmtrc.json`, `vitest.workspace.ts`, `vitest.config.ts`, `scripts/validate.ts`
  - Pre-commit: `bun validate`

- [ ] 7. Initialize AGENTS.md with Progressive Disclosure

  **What to do**:
  - Create `AGENTS.md` at root with progressive disclosure structure:
    - **Level 1 (Always visible)**: Project overview, monorepo layout, quick start commands
    - **Level 2 (Context-dependent)**: File contracts per app, import rules, testing guidelines
    - **Level 3 (Feature-specific)**: VSA slice anatomy details, Mastra workflow patterns, AI generation specifics
  - Include sections:
    - Project identity (Gosto, desktop-first AI design tool)
    - Monorepo structure (apps/ + packages/ layout)
    - Tech stack summary table
    - Quick start commands (`bun install`, `turbo dev`, `turbo build`, `bun validate`)
    - File contract summaries (with link to `docs/architecture-plan.md` for full detail)
    - Cross-package import rules (from architecture plan)
    - TDD workflow (typechecker → test → implement)
    - AI agent coding guidelines (from architecture plan)
    - Feature registration pattern (satisfies ServerFeature / UIFeature)
  - Reference `docs/architecture-plan.md` as the authoritative source for details

  **Must NOT do**:
  - Do NOT duplicate the entire architecture-plan.md — AGENTS.md is a summary with progressive disclosure
  - Do NOT include implementation details that belong in specs

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation writing with structured progressive disclosure
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 8)
  - **Blocks**: None
  - **Blocked By**: Task 4b

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md` — Full architecture details to summarize
  - POC `AGENTS.md` — Existing AGENTS.md from POC (reference for structure)

  **External References**:
  - AGENTS.md progressive disclosure pattern: concise overview → detailed sections

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: Source of truth — AGENTS.md summarizes it with progressive disclosure
  - POC AGENTS.md: Shows what was useful before — learn from it

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md has progressive disclosure structure
    Tool: Bash
    Preconditions: AGENTS.md exists at root
    Steps:
      1. Check file: `test -f AGENTS.md && echo "EXISTS"`
      2. Verify key sections: `grep -c "Project Overview\|Monorepo Layout\|File Contracts\|Import Rules\|TDD Workflow\|Quick Start" AGENTS.md`
      3. Verify architecture-plan reference: `grep "architecture-plan.md" AGENTS.md`
    Expected Result: AGENTS.md exists with ≥5 key sections and references architecture plan
    Evidence: .sisyphus/evidence/task-7-agents-md.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `docs: add AGENTS.md with progressive disclosure`
  - Files: `AGENTS.md`
  - Pre-commit: `test -f AGENTS.md`

- [ ] 8. Initialize Backlog.md with MVP Tasks

  **What to do**:
  - If not already done in Task 3, complete Backlog.md initialization:
    - `backlog init "Gosto"` with project settings
  - Create MVP feature tasks as Backlog.md tasks:
    - Task: "Canvas — React Flow infinite canvas with pan/zoom/drag"
    - Task: "AI Generation — Mastra workflow for design generation"
    - Task: "Pipeline — Multi-model layout→images→review pipeline"
    - Task: "Projects — CRUD with SQLite persistence"
    - Task: "Export — Tailwind CSS / React / SVG export"
    - Task: "Settings — BYOK API keys + model selection"
    - Task: "Desktop Shell — Electrobun wrapping server + web"
    - Task: "Shared Package — Contracts, schemas, types"
  - Create infrastructure tasks:
    - Task: "CI/CD Pipeline — GitHub Actions"
    - Task: "Testing Infrastructure — Vitest + Playwright"
  - Set DoD (Definition of Done) defaults in backlog config
  - Configure MCP integration: add backlog mcp config to project

  **Must NOT do**:
  - Do NOT create post-MVP tasks in detail (just rough placeholders)
  - Do NOT start implementing features

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Task creation with CLI tool — straightforward
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: None
  - **Blocked By**: Task 3 (needs v2 PRD for task descriptions), Task 4b

  **References**:

  **External References**:
  - Backlog.md CLI: https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md
  - Task 3 output: `docs/prd-v2.md` — Source for task descriptions

  **WHY Each Reference Matters**:
  - v2 PRD: Defines what MVP tasks to create
  - Backlog.md CLI: Command reference for task creation

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Backlog has MVP tasks
    Tool: Bash
    Preconditions: backlog/ initialized
    Steps:
      1. List tasks: `backlog task list --plain 2>/dev/null | head -20`
      2. Count MVP tasks: `backlog task list --plain 2>/dev/null | grep -i "canvas\|generation\|pipeline\|project\|export\|setting\|desktop\|shared" | wc -l`
    Expected Result: ≥8 MVP tasks visible in backlog
    Evidence: .sisyphus/evidence/task-8-backlog-tasks.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `chore: initialize Backlog.md with MVP tasks`
  - Files: `backlog/`
  - Pre-commit: `test -d backlog`

- [ ] 9. Scaffold apps/server (Hono + Drizzle + Mastra + File Contracts)

  **What to do**:
  - Create `apps/server/` with Hono + Bun runtime:
    - `src/app.ts` — Hono app with feature registration pattern
    - `src/index.ts` — Server entry point (Bun.serve), exports `AppType`
    - `src/infrastructure/db/client.ts` — SQLite singleton
    - `src/infrastructure/db/schema/` — Drizzle table definitions (one per entity)
    - `src/infrastructure/db/migrations/` — Drizzle migrations directory
    - `src/infrastructure/mastra/index.ts` — Mastra instance singleton
    - `src/infrastructure/mastra/memory.ts` — LibSQLStore for Mastra memory
    - `src/infrastructure/logger.ts` — LogTape root logger
    - `src/infrastructure/tracing.ts` — Hono tracing plugin setup
    - `src/features/` — Feature slices directory (empty, ready for Wave 4)
  - Set up `drizzle.config.ts` for migrations
  - Configure `package.json` with dependencies:
    - hono, @hono/zod-validator, drizzle-orm, @mastra/core, @mastra/hono, logtape
  - Configure `tsconfig.json` extending `@app/config/tsconfig/bun.json`
  - Write `src/features/_example/` as a reference feature slice:
    - `index.ts`, `route.ts`, `service.ts`, `schema.ts`, `repository.ts`, `service.test.ts`
    - Demonstrates the `satisfies ServerFeature` pattern
  - Verify: `turbo typecheck --filter=@app/server` passes
  - Verify: Hono AppType is exportable for RPC client

  **Must NOT do**:
  - Do NOT implement real features (scaffold + example only)
  - Do NOT import Drizzle in route.ts (firewall rule)
  - Do NOT create more than one example feature

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple infrastructure components to wire together (Hono, Drizzle, Mastra, SSE)
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11, 12, 13)
  - **Blocks**: Tasks 14, 16, 17, 18
  - **Blocked By**: Tasks 5 (shared contracts), 6 (configs)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:94-133` — Server feature slice anatomy (MANDATORY)
  - `docs/architecture-plan.md:234-254` — Server infrastructure layout
  - `docs/architecture-plan.md:258-284` — App wiring pattern with ServerFeature[]
  - `docs/architecture-plan.md:127-132` — route.ts FIREWALL rule

  **API/Type References**:
  - `packages/shared/src/contracts/` — ServerFeature interface definition
  - POC `apps/server/src/index.ts` — Hono server entry point pattern

  **External References**:
  - Hono docs: https://hono.dev/docs
  - Drizzle ORM: https://orm.drizzle.team/docs/overview
  - Mastra + Hono: https://mastra.ai/guides/getting-started/hono
  - @mastra/hono adapter: https://mastra.ai/reference/server/hono-adapter

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: The authoritative server anatomy — follow EXACTLY
  - Mastra + Hono guide: Shows integration pattern with @mastra/hono adapter
  - POC server: Reference for how Hono was configured before

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Server scaffolds and starts
    Tool: Bash
    Preconditions: apps/server/ fully structured
    Steps:
      1. Build: `turbo build --filter=@app/server`
      2. Start server briefly: `timeout 5 bun apps/server/src/index.ts 2>&1 || true`
      3. Check AppType export: `bun -e "import type { AppType } from './apps/server/src/app'; console.log('OK')"`
    Expected Result: Build succeeds, server starts, AppType is importable as type
    Evidence: .sisyphus/evidence/task-9-server-start.txt

  Scenario: Example feature satisfies ServerFeature contract
    Tool: Bash
    Preconditions: src/features/_example/ exists
    Steps:
      1. Check example structure: `ls apps/server/src/features/_example/`
      2. Verify satisfies: `grep "satisfies ServerFeature" apps/server/src/features/_example/index.ts`
      3. Verify firewall: verify route.ts has NO drizzle/db imports
    Expected Result: Example has all required files and satisfies contract
    Evidence: .sisyphus/evidence/task-9-server-feature.txt

  Scenario: Mastra integration works
    Tool: Bash
    Preconditions: Mastra singleton configured
    Steps:
      1. Check mastra config: `test -f apps/server/src/infrastructure/mastra/index.ts && echo "EXISTS"`
      2. Verify import: `grep "@mastra/core\|@mastra/hono" apps/server/src/infrastructure/mastra/index.ts`
    Expected Result: Mastra instance configured and importable
    Evidence: .sisyphus/evidence/task-9-mastra.txt
  ```

  **Commit**: YES
  - Message: `feat(server): scaffold hono server with VSA file contracts`
  - Files: `apps/server/`
  - Pre-commit: `turbo typecheck --filter=@app/server`

- [ ] 10. Scaffold apps/web (TanStack Start + React Flow + shadcn/ui + File Contracts)

  **What to do**:
  - Create `apps/web/` with TanStack Start + React + Vite:
    - `src/main.tsx` — App entry point with TanStack Start
    - `src/routes/` — TanStack Router file-based routes
    - `src/features/` — Feature slices directory (empty, ready for Wave 4)
    - `src/shared/lib/rpc-client.ts` — Singleton Hono RPC client (`hc<AppType>()`)
    - `src/shared/ui/` — shadcn/ui components (Button, Dialog, etc.)
  - Install and configure:
    - TanStack Start + Router + Query
    - React Flow (@xyflow/react)
    - shadcn/ui + Tailwind v4
    - @xstate/store for client state
    - react-hook-form + zod for forms
    - motion for animations
  - Configure `tsconfig.json` with project reference to `../server` for AppType
  - Set up `components.json` for shadcn/ui
  - Write `src/features/_example/` as reference UIFeature:
    - `index.ts`, `ui/ExamplePage.tsx`, `model/example.store.ts`, `api/example.api.ts`
    - Demonstrates `satisfies UIFeature` pattern
  - Set up dark mode with `.dark` class (shadcn/ui convention)
  - Verify: `turbo build --filter=@app/web` passes

  **Must NOT do**:
  - Do NOT implement real features (scaffold + example only)
  - Do NOT instantiate `hc<AppType>()` inside components (singleton only)
  - Do NOT import server runtime code (type-only imports)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple frontend frameworks to wire together (TanStack Start, React Flow, shadcn/ui)
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11, 12, 13)
  - **Blocks**: Tasks 15, 17
  - **Blocked By**: Tasks 5 (shared contracts), 6 (configs)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:137-165` — UI feature slice anatomy (MANDATORY)
  - `docs/architecture-plan.md:216-230` — Hono RPC type safety pattern
  - `docs/architecture-plan.md:286-298` — Cross-package import rules

  **API/Type References**:
  - `packages/shared/src/contracts/` — UIFeature interface definition
  - POC `apps/web/src/` — TanStack Router + React Flow + shadcn/ui patterns

  **External References**:
  - TanStack Start: https://tanstack.com/start/latest
  - React Flow: https://reactflow.dev/
  - shadcn/ui: https://ui.shadcn.com/
  - @xstate/store: https://stately.ai/docs/xstate-store

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: UI anatomy — follow EXACTLY
  - POC web app: Shows working TanStack Router + React Flow + shadcn setup
  - TanStack Start docs: New framework — need official setup guidance

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Web app scaffolds and builds
    Tool: Bash
    Preconditions: apps/web/ fully structured
    Steps:
      1. Build: `turbo build --filter=@app/web`
      2. Verify output: `test -d apps/web/dist && echo "DIST EXISTS"`
    Expected Result: Build succeeds, dist/ output exists
    Evidence: .sisyphus/evidence/task-10-web-build.txt

  Scenario: Hono RPC client configured with AppType
    Tool: Bash
    Preconditions: rpc-client.ts exists
    Steps:
      1. Check client: `test -f apps/web/src/shared/lib/rpc-client.ts && echo "EXISTS"`
      2. Verify type import: `grep "import type" apps/web/src/shared/lib/rpc-client.ts`
    Expected Result: RPC client with type-only import from server
    Evidence: .sisyphus/evidence/task-10-rpc-client.txt

  Scenario: shadcn/ui components available
    Tool: Bash
    Preconditions: components.json configured
    Steps:
      1. Check config: `test -f apps/web/components.json && echo "EXISTS"`
      2. Verify Tailwind: `grep "tailwindcss" apps/web/package.json`
    Expected Result: shadcn/ui configured with Tailwind v4
    Evidence: .sisyphus/evidence/task-10-shadcn.txt
  ```

  **Commit**: YES
  - Message: `feat(web): scaffold TanStack Start app with FSD file contracts`
  - Files: `apps/web/`
  - Pre-commit: `turbo typecheck --filter=@app/web`

- [ ] 11. Scaffold packages/desktop (Electrobun Shell)

  **What to do**:
  - Create `packages/desktop/` with Electrobun configuration:
    - `electrobun.config.ts` — Electrobun configuration
    - `src/index.ts` — Desktop entry point (spawns server, opens WebView)
    - `src/ipc.ts` — IPC handlers for desktop-web communication
  - Configure to:
    - Spawn Hono server as a subprocess
    - Open WebView pointing to `http://localhost:{port}`
    - Handle app lifecycle (startup, shutdown, window management)
  - Configure build:
    - Vite build for desktop-specific code
    - Reference apps/web build output for WebView content
  - Set up `package.json` with Electrobun dependency and build scripts
  - Verify: Desktop can be built (`turbo build --filter=@app/desktop`)

  **Must NOT do**:
  - Do NOT add business logic to desktop shell (orchestration only)
  - Do NOT import UI code directly (runs in separate WebView)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Electrobun is newer framework — needs careful integration
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 12, 13)
  - **Blocks**: Task 19
  - **Blocked By**: Task 4b

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:22-29` — Desktop package role (orchestrates only)
  - `docs/architecture-plan.md:286-298` — Cross-package import rules (desktop → server allowed, desktop → ui forbidden)
  - POC `platforms/desktop/` — Electrobun configuration reference

  **External References**:
  - Electrobun: https://github.com/nicholasgasior/electrobun (or official repo)

  **WHY Each Reference Matters**:
  - `architecture-plan.md`: Defines desktop's role — orchestrator only
  - POC desktop: Shows working Electrobun config

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Desktop package builds
    Tool: Bash
    Preconditions: packages/desktop/ configured
    Steps:
      1. Build: `turbo build --filter=@app/desktop`
      2. Check config: `test -f packages/desktop/electrobun.config.ts && echo "EXISTS"`
    Expected Result: Build succeeds, electrobun config exists
    Evidence: .sisyphus/evidence/task-11-desktop-build.txt

  Scenario: Desktop entry spawns server and loads WebView
    Tool: Bash
    Preconditions: src/index.ts exists
    Steps:
      1. Check entry: `test -f packages/desktop/src/index.ts && echo "EXISTS"`
      2. Verify server spawn: `grep -i "spawn\|server\|localhost" packages/desktop/src/index.ts`
    Expected Result: Entry file references server process and localhost URL
    Evidence: .sisyphus/evidence/task-11-desktop-entry.txt
  ```

  **Commit**: YES
  - Message: `feat(desktop): scaffold Electrobun desktop shell`
  - Files: `packages/desktop/`
  - Pre-commit: `turbo build --filter=@app/desktop`

- [ ] 12. Write Initial v2 MADRs

  **What to do**:
  - Write MADRs for key v2 architecture decisions in `docs/decisions/`:
    - `0010-v2-tanstack-start-over-nextjs.md` — Why TanStack Start
    - `0011-v2-hono-over-express.md` — Why Hono for server
    - `0012-v2-bun-workspaces-over-pnpm.md` — Why Bun workspaces
    - `0013-v2-electrobun-over-tauri.md` — Why Electrobun for desktop
    - `0014-v2-react-flow-custom-canvas.md` — Why React Flow
    - `0015-v2-shadcn-tailwind-v4.md` — Why shadcn/ui + Tailwind v4
    - `0016-v2-xstate-store-over-zustand.md` — Why @xstate/store
  - Each MADR follows MADR 3.x format with Context, Options, Decision, Consequences
  - Reference the architecture-plan.md where applicable

  **Must NOT do**:
  - Do NOT write implementation code
  - Do NOT duplicate PRD content (ADRs are for specific decisions)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation writing — MADRs are decision records
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11, 13)
  - **Blocks**: None
  - **Blocked By**: Task 3 (needs v2 PRD for context)

  **References**:

  **External References**:
  - MADR template: https://github.com/adr/madr/blob/develop/template/adr-template.md

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: v2 MADRs cover key architecture decisions
    Tool: Bash
    Preconditions: docs/decisions/ populated
    Steps:
      1. Count v2 MADRs: `ls docs/decisions/001*.md | wc -l`
      2. Verify format: `grep -l "Decision Outcome" docs/decisions/001*.md | wc -l`
    Expected Result: ≥7 MADRs (0001-0016), all with Decision Outcome section
    Evidence: .sisyphus/evidence/task-12-madrs.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `docs: add v2 architecture decision records`
  - Files: `docs/decisions/0010-*.md` through `docs/decisions/0016-*.md`
  - Pre-commit: none

- [ ] 13. Set Up CI/CD (GitHub Actions) + Release Branching

  **What to do**:
  - Create `.github/workflows/ci.yml`:
    - Trigger: PR to main, push to main/develop
    - Steps: bun install → turbo validate (format+lint+typecheck+test)
    - Matrix: macOS + Ubuntu (for cross-platform desktop)
  - Create `.github/workflows/release.yml`:
    - Trigger: Push tag `v*`
    - Steps: build desktop → create GitHub release with dmg/exe artifacts
  - Set up git branching strategy:
    - `main` — stable, always deployable
    - `develop` — integration branch
    - `feature/*` — feature branches from develop
    - `release/*` — release prep branches
  - Add `CONTRIBUTING.md` with branch naming and PR conventions
  - Verify CI workflow syntax (can use `actionlint` or similar)
  - Note: Version management (changesets + commitlint) is already set up in Task 4b — CI uses existing config

  **Must NOT do**:
  - Do NOT set up deployment to external hosting (desktop-first)
  - Do NOT create release automation beyond GitHub Release

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CI/CD setup with cross-platform matrix and release branching
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11, 12)
  - **Blocks**: None
  - **Blocked By**: Task 4b

  **References**:

  **Pattern References** (POC as reference):
  - POC `.github/workflows/ci.yml` — CI validation workflow
  - POC `.github/workflows/release.yml` — macOS .dmg release

  **External References**:
  - Changesets: https://github.com/changesets/changesets
  - GitHub Actions for Bun: https://github.com/oven-sh/setup-bun

  **WHY Each Reference Matters**:
  - POC CI: Proven GitHub Actions config with Bun setup

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CI workflow is syntactically valid
    Tool: Bash
    Preconditions: .github/workflows/ci.yml exists
    Steps:
      1. Check file: `test -f .github/workflows/ci.yml && echo "EXISTS"`
      2. Verify key steps: `grep -c "bun\|turbo\|install\|validate" .github/workflows/ci.yml`
    Expected Result: CI workflow with bun install + turbo validate steps
    Evidence: .sisyphus/evidence/task-13-ci.txt
  ```

  **Commit**: YES
  - Message: `ci: add GitHub Actions CI/CD and release branching`
  - Files: `.github/`, `CONTRIBUTING.md`
  - Pre-commit: none

- [ ] 14. Implement AI Generation Pipeline (Mastra Workflow)

  **What to do**:
  - Create `apps/server/src/features/generate/` following VSA anatomy:
    - `schema.ts` — Zod schemas for generation request/response (extending shared schemas)
    - `repository.ts` — Drizzle queries for saving/retrieving generated designs
    - `service.ts` — Business logic: orchestrates Mastra workflow
    - `route.ts` — Hono router with SSE streaming endpoint
    - `index.ts` — Public API with `satisfies ServerFeature`
  - Create `apps/server/src/features/generate/ai/`:
    - `agent.ts` — Mastra agent definition for design generation
    - `workflow.ts` — Mastra workflow steps (layout → images → review)
    - `tools.ts` — Mastra tool definitions (if needed)
  - Implement the pipeline steps as self-contained functions:
    - `layoutStep`: Prompt → AI generates HTML/CSS layout
    - `imageStep`: HTML → AI generates/replaces image placeholders
    - `reviewStep`: HTML + prompt → AI reviews and fixes issues
  - Each step: `const step = (input: Input): Output => {}` then wire via Mastra workflow
  - Wire the feature in `app.ts` at `/api/generate`
  - Create `apps/web/src/features/generate/` following FSD anatomy:
    - `model/generate.store.ts` — @xstate/store for generation state
    - `model/generate.query.ts` — TanStack Query mutation for triggering generation
    - `api/generate.stream.ts` — SSE consumer for streaming generation progress
    - `ui/GeneratePage.tsx` — Prompt input UI
  - Write tests: `service.test.ts` before implementation (TDD)

  **Must NOT do**:
  - Do NOT implement multi-provider support (start with Anthropic via Mastra default)
  - Do NOT implement critique loop (post-MVP)
  - Do NOT import Drizzle in route.ts (firewall rule)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core AI pipeline — Mastra workflow design with multi-step orchestration
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 15-19)
  - **Blocks**: Task 20
  - **Blocked By**: Task 9 (server skeleton)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:94-133` — Server VSA anatomy
  - `docs/architecture-plan.md:137-165` — UI FSD anatomy
  - `src/app/api/pipeline/layout/route.ts` — Original pipeline (350 lines) — reference for prompt design
  - `src/app/api/pipeline/review/route.ts` — Original review stage
  - `src/lib/types.ts:DesignIteration` — Original design output type

  **API/Type References**:
  - `packages/shared/src/schemas/generation.schema.ts` — Generation request/response types
  - `packages/shared/src/contracts/feature.types.ts` — ServerFeature interface

  **External References**:
  - Mastra workflows: https://mastra.ai/docs/workflows/overview
  - Mastra + Hono: https://mastra.ai/guides/getting-started/hono
  - Mastra SSE: https://mastra.ai (streaming docs)

  **WHY Each Reference Matters**:
  - Original pipeline: Shows the 3-step flow (layout→images→review) — replicate the logic
  - Mastra workflow docs: How to define multi-step workflows with Mastra
  - `architecture-plan.md`: Must follow the ai/ directory convention

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generation pipeline produces HTML from prompt
    Tool: Bash (curl)
    Preconditions: Server running on localhost
    Steps:
      1. Start server: `bun apps/server/src/index.ts &`
      2. Send generation request: `curl -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"prompt":"A dark login form","apiKey":"test-key"}'`
      3. Check response contains HTML: verify response has <html or <div content
      4. Kill server
    Expected Result: 200 response with generated HTML content
    Failure Indicators: 500 error, empty response, no HTML in output
    Evidence: .sisyphus/evidence/task-14-generate-pipeline.txt

  Scenario: SSE streaming works for generation progress
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Send request with Accept: text/event-stream
      2. Verify SSE events received (data: prefix)
    Expected Result: Streaming SSE events with generation progress
    Evidence: .sisyphus/evidence/task-14-sse-stream.txt

  Scenario: Generation service tests pass
    Tool: Bash
    Preconditions: service.test.ts exists
    Steps:
      1. Run tests: `turbo test --filter=@app/server`
    Expected Result: All generation service tests pass
    Evidence: .sisyphus/evidence/task-14-service-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(pipeline): implement AI generation via Mastra workflow`
  - Files: `apps/server/src/features/generate/`, `apps/web/src/features/generate/`
  - Pre-commit: `turbo test --filter=@app/server`

- [ ] 15. Implement Canvas Feature (React Flow + Design Nodes)

  **What to do**:
  - Create `apps/web/src/features/canvas/` following FSD anatomy:
    - `ui/CanvasPage.tsx` — Main canvas page with React Flow
    - `ui/DesignNode.tsx` — Custom React Flow node rendering HTML in iframe
    - `ui/CanvasToolbar.tsx` — Toolbar (select, zoom, fit)
    - `model/canvas.store.ts` — @xstate/store for canvas state (nodes, edges, viewport)
    - `model/canvas.query.ts` — TanStack Query for loading/saving canvas state
    - `api/canvas.api.ts` — Hono RPC calls for canvas data
    - `index.ts` — Public API with `satisfies UIFeature`
  - Implement canvas features:
    - Pan + zoom via React Flow built-in controls
    - Custom DesignNode component: renders generated HTML in sandboxed iframe
    - Auto-measurement: iframe reports content height via PostMessage
    - Node drag + multi-select + rubber band selection
    - Zoom controls (in/out/fit)
  - Create `apps/server/src/features/canvas/` for persistence:
    - `repository.ts` — Drizzle queries for design groups/iterations
    - `service.ts` — Canvas CRUD operations
    - `route.ts` — REST endpoints for canvas data
    - `index.ts` — satisfies ServerFeature
  - Ensure AI-generated HTML uses Tailwind v4 + shadcn CDN links (update prompts)
  - Write TDD tests for service and store

  **Must NOT do**:
  - Do NOT implement custom pan/zoom (use React Flow built-in)
  - Do NOT implement comment pins (post-MVP)
  - Do NOT implement nested groups (post-MVP)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Heavy UI component work with React Flow + iframe rendering
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 16-19)
  - **Blocks**: Task 20
  - **Blocked By**: Task 10 (web skeleton)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:137-165` — UI FSD anatomy
  - `src/components/design-card.tsx` — Original iframe rendering (sandbox + auto-measurement)
  - `src/hooks/use-canvas.ts` — Original canvas pan/zoom logic (reference for viewport behavior)
  - POC `apps/web/src/features/canvas/` — React Flow integration

  **API/Type References**:
  - `packages/shared/src/schemas/canvas.schema.ts` — Canvas node/position types
  - React Flow API: https://reactflow.dev/api-reference

  **WHY Each Reference Matters**:
  - Original `design-card.tsx`: Shows iframe rendering pattern — reuse the sandbox approach
  - React Flow docs: Custom node rendering, pan/zoom configuration
  - POC canvas: Shows React Flow + custom nodes working together

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Canvas renders with React Flow and custom nodes
    Tool: Playwright
    Preconditions: Web app running on localhost
    Steps:
      1. Navigate to http://localhost:5173/project/test-project-id
      2. Verify React Flow canvas loads: check for .react-flow element
      3. Add a design node via generation
      4. Verify custom node renders with iframe
    Expected Result: Canvas visible, custom nodes render HTML in iframes
    Evidence: .sisyphus/evidence/task-15-canvas-render.png

  Scenario: Pan and zoom work via React Flow
    Tool: Playwright
    Preconditions: Canvas with nodes
    Steps:
      1. Mouse wheel to zoom in
      2. Drag background to pan
      3. Verify viewport changes
    Expected Result: Pan and zoom respond to user input
    Evidence: .sisyphus/evidence/task-15-canvas-interact.png
  ```

  **Commit**: YES
  - Message: `feat(canvas): implement React Flow canvas with design nodes`
  - Files: `apps/web/src/features/canvas/`, `apps/server/src/features/canvas/`
  - Pre-commit: `turbo test --filter=@app/server && turbo typecheck --filter=@app/web`

- [ ] 16. Implement Project Management Feature (CRUD + SQLite)

  **What to do**:
  - Create `apps/server/src/features/projects/` following VSA anatomy:
    - `schema.ts` — Zod schemas (extend shared project schemas)
    - `repository.ts` — Drizzle queries (projects table CRUD)
    - `service.ts` — Business logic (create, list, get, update, delete)
    - `route.ts` — REST endpoints (GET/POST/PUT/DELETE /api/projects)
    - `service.test.ts` — TDD tests for service layer
    - `index.ts` — satisfies ServerFeature
  - Create `apps/web/src/features/projects/` following FSD anatomy:
    - `ui/ProjectList.tsx` — Sidebar with project list
    - `ui/ProjectCreateDialog.tsx` — Create new project dialog
    - `model/project.store.ts` — @xstate/store for selected project
    - `model/project.query.ts` — TanStack Query hooks for CRUD
    - `api/project.api.ts` — Hono RPC calls
    - `index.ts` — satisfies UIFeature
  - Drizzle schema for `projects` table:
    - id (uuid), name (text), createdAt, updatedAt, lastFormFactor (text nullable)
  - URL routing: `/project/$projectId` via TanStack Router
  - Persist currentProjectId to URL state (TanStack Router)
  - Auto-select most recent project on load
  - Cascade delete: deleting project removes all related data

  **Must NOT do**:
  - Do NOT implement tags, search, or sorting (post-MVP)
  - Do NOT implement project sharing or collaboration (post-MVP)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full-stack CRUD with Drizzle + server + UI + TanStack Query wiring
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15, 17-19)
  - **Blocks**: Task 20
  - **Blocked By**: Task 9 (server skeleton)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:94-133` — Server VSA anatomy
  - `docs/architecture-plan.md:137-165` — UI FSD anatomy
  - POC `packages/database/drizzle/schema.ts` — Drizzle project table schema

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Project CRUD API works end-to-end
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Create: `curl -X POST http://localhost:3000/api/projects -H "Content-Type: application/json" -d '{"name":"Test Project"}'`
      2. List: `curl http://localhost:3000/api/projects`
      3. Update: `curl -X PUT http://localhost:3000/api/projects/{id} -d '{"name":"Updated"}'`
      4. Delete: `curl -X DELETE http://localhost:3000/api/projects/{id}`
    Expected Result: All CRUD operations return correct status codes and data
    Evidence: .sisyphus/evidence/task-16-project-crud.txt

  Scenario: Project service tests pass
    Tool: Bash
    Steps:
      1. Run: `turbo test --filter=@app/server`
    Expected Result: All project service tests pass
    Evidence: .sisyphus/evidence/task-16-service-tests.txt

  Scenario: Project sidebar renders in UI
    Tool: Playwright
    Preconditions: Web app running
    Steps:
      1. Navigate to root
      2. Verify project sidebar visible
      3. Create new project
      4. Verify project appears in list
    Expected Result: Project sidebar shows projects, create works
    Evidence: .sisyphus/evidence/task-16-project-ui.png
  ```

  **Commit**: YES
  - Message: `feat(projects): implement project CRUD with SQLite persistence`
  - Files: `apps/server/src/features/projects/`, `apps/web/src/features/projects/`
  - Pre-commit: `turbo test --filter=@app/server`

- [ ] 17. Implement Export Feature (Tailwind, React, SVG)

  **What to do**:
  - Create `apps/server/src/features/export/` following VSA anatomy:
    - `schema.ts` — Zod schemas for export request (html, format) and response
    - `service.ts` — Business logic: format-specific conversion
    - `route.ts` — POST /api/export endpoint
    - `service.test.ts` — TDD tests
    - `index.ts` — satisfies ServerFeature
  - Create `apps/web/src/features/export/` following FSD anatomy:
    - `ui/ExportDialog.tsx` — Export modal with format selection
    - `model/export.query.ts` — TanStack Query mutation for export
    - `api/export.api.ts` — Hono RPC call
    - `index.ts` — satisfies UIFeature
  - Implement export formats:
    - **SVG**: Wrap HTML in SVG foreignObject
    - **Tailwind CSS**: AI-powered conversion from custom CSS to Tailwind classes
    - **React Component**: AI-powered conversion to TypeScript + Tailwind
  - AI export uses Mastra agent with specific prompts per format
  - Wire in `app.ts` at `/api/export`

  **Must NOT do**:
  - Do NOT implement Figma export (post-MVP)
  - Do NOT implement PDF export (post-MVP)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: AI-powered format conversion with Mastra agent + server + UI
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14-16, 18-19)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 9, 10

  **References**:

  **Pattern References**:
  - `src/app/api/export/route.ts` — Original export implementation (111 lines)
  - `docs/architecture-plan.md:94-133` — Server VSA anatomy

  **WHY Each Reference Matters**:
  - Original export: Shows working SVG + Tailwind + React conversion — replicate logic

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Export API produces valid Tailwind output
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. `curl -X POST http://localhost:3000/api/export -H "Content-Type: application/json" -d '{"html":"<div style=\"padding:20px;color:red\">Hello</div>","format":"tailwind"}'`
      2. Verify response contains Tailwind classes (p-5, text-red-*)
    Expected Result: 200 with HTML using Tailwind classes instead of inline styles
    Evidence: .sisyphus/evidence/task-17-export-tailwind.txt

  Scenario: Export dialog works in UI
    Tool: Playwright
    Steps:
      1. Select a design on canvas
      2. Click export button
      3. Select format
      4. Verify output displayed/downloadable
    Expected Result: Export dialog shows format options, produces output
    Evidence: .sisyphus/evidence/task-17-export-ui.png
  ```

  **Commit**: YES
  - Message: `feat(export): implement Tailwind/React/SVG export`
  - Files: `apps/server/src/features/export/`, `apps/web/src/features/export/`
  - Pre-commit: `turbo test --filter=@app/server`

- [ ] 18. Implement Settings Feature (BYOK + Model Selection)

  **What to do**:
  - Create `apps/server/src/features/settings/` following VSA anatomy:
    - `schema.ts` — Zod schemas for settings (apiKey, model, etc.)
    - `repository.ts` — Drizzle queries for settings table (key-value store)
    - `service.ts` — Business logic: get/set settings, validate API keys
    - `route.ts` — GET/PUT /api/settings
    - `service.test.ts` — TDD tests
    - `index.ts` — satisfies ServerFeature
  - Create `apps/web/src/features/settings/` following FSD anatomy:
    - `ui/SettingsDialog.tsx` — Settings modal with tabs (API Keys, Model, General)
    - `model/settings.store.ts` — @xstate/store for settings state
    - `model/settings.query.ts` — TanStack Query for loading/saving settings
    - `api/settings.api.ts` — Hono RPC calls
    - `schema.ts` — Zod schemas for form validation (react-hook-form)
    - `index.ts` — satisfies UIFeature
  - Settings stored in SQLite settings table (key-value)
  - API keys: Anthropic, OpenAI (for future), Gemini
  - Model selection: list of available models
  - API key validation: test key before saving

  **Must NOT do**:
  - Do NOT store API keys in localStorage (server-side only)
  - Do NOT implement theme settings (dark mode is default)
  - Do NOT implement cloud sync for settings (local only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward CRUD with known patterns
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14-17, 19)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 9, 10

  **References**:

  **Pattern References**:
  - `src/hooks/use-settings.ts` — Original settings hook (localStorage pattern)
  - `src/components/settings-modal.tsx` — Original settings UI (reference for layout)
  - `docs/architecture-plan.md:94-133` — Server VSA anatomy

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Settings API stores and retrieves API keys
    Tool: Bash (curl)
    Steps:
      1. Save: `curl -X PUT http://localhost:3000/api/settings -d '{"anthropicApiKey":"sk-test-123"}'`
      2. Load: `curl http://localhost:3000/api/settings | grep "anthropicApiKey"`
    Expected Result: Settings persist and retrieve correctly
    Evidence: .sisyphus/evidence/task-18-settings-api.txt

  Scenario: Settings dialog renders in UI
    Tool: Playwright
    Steps:
      1. Click settings icon
      2. Verify dialog with API key inputs
      3. Enter test key and save
    Expected Result: Settings dialog functional with form validation
    Evidence: .sisyphus/evidence/task-18-settings-ui.png
  ```

  **Commit**: YES
  - Message: `feat(settings): implement BYOK settings with model selection`
  - Files: `apps/server/src/features/settings/`, `apps/web/src/features/settings/`
  - Pre-commit: `turbo test --filter=@app/server`

- [ ] 19. Wire Desktop Shell (Electrobun → Server → WebView)

  **What to do**:
  - Complete the `packages/desktop/` Electrobun integration:
    - `src/index.ts` — Full desktop entry:
      1. Spawn Hono server subprocess (`bun apps/server/src/index.ts`)
      2. Wait for server ready (health check polling)
      3. Open WebView pointing to `http://localhost:{port}`
      4. Handle shutdown (SIGTERM → kill server → close window)
    - `src/ipc.ts` — IPC handlers:
      - `server:status` — Check if server is running
      - `app:quit` — Graceful shutdown
      - `app:version` — Return app version from package.json
  - Configure Electrobun build:
    - Bundle server output into desktop package
    - Set app metadata (name, version, icon)
    - Configure window (title, size, minimum size)
  - Test the full startup sequence: desktop → server → webview → canvas
  - Verify shutdown cleans up server process

  **Must NOT do**:
  - Do NOT add auto-update (post-MVP)
  - Do NOT add system tray (post-MVP)
  - Do NOT add custom menu bar items beyond defaults (post-MVP)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Cross-process orchestration (Electrobun + Bun subprocess + WebView)
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14-18)
  - **Blocks**: Task 20
  - **Blocked By**: Task 11 (desktop skeleton)

  **References**:

  **Pattern References**:
  - `docs/architecture-plan.md:22-29` — Desktop package role
  - `docs/architecture-plan.md:286-298` — Import rules (desktop → server: runtime allowed)
  - POC `platforms/desktop/` — Electrobun configuration reference

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Desktop app launches and shows canvas
    Tool: interactive_bash (tmux)
    Preconditions: Desktop app built
    Steps:
      1. Launch desktop: `bun packages/desktop/src/index.ts`
      2. Wait 5 seconds for startup
      3. Check server is running: `curl http://localhost:3000/api/projects`
      4. Verify window appeared (Electrobun window)
    Expected Result: Desktop launches, server starts, window shows canvas
    Evidence: .sisyphus/evidence/task-19-desktop-launch.txt

  Scenario: Desktop shuts down cleanly
    Tool: interactive_bash (tmux)
    Preconditions: Desktop running
    Steps:
      1. Send SIGTERM to desktop process
      2. Verify server process also terminated
    Expected Result: Both desktop and server processes terminated
    Evidence: .sisyphus/evidence/task-19-desktop-shutdown.txt
  ```

  **Commit**: YES
  - Message: `feat(desktop): wire Electrobun to spawn server and load WebView`
  - Files: `packages/desktop/`
  - Pre-commit: none

- [ ] 20. Integration: Desktop App End-to-End Flow

  **What to do**:
  - Wire all features together into a complete user flow:
    1. Launch desktop → server starts → canvas loads
    2. User enters API key in settings → persisted to SQLite
    3. User creates project → appears in sidebar
    4. User types prompt → AI generates HTML/CSS → appears as node on canvas
    5. User selects node → export dialog → produces Tailwind/React/SVG
    6. User quits → state persisted → relaunches with same state
  - Verify cross-feature integration:
    - Generate feature creates canvas nodes (canvas ← generate)
    - Export reads selected canvas nodes (export ← canvas)
    - Settings provides API keys to generation pipeline (generate ← settings)
    - Projects scope canvas content (canvas ← projects)
  - Fix any integration issues discovered during end-to-end testing
  - Verify all features work together (not just in isolation)
  - Ensure TanStack Router URL state works (project ID in URL)

  **Must NOT do**:
  - Do NOT add new features — only fix integration issues
  - Do NOT refactor working code — only fix breakages

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Cross-feature integration debugging and wiring
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential, depends on all Wave 4 tasks)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 14-19

  **References**:

  **Pattern References**:
  - All feature implementations from Wave 4
  - `docs/architecture-plan.md:258-284` — App wiring pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Complete user flow works end-to-end
    Tool: interactive_bash (tmux) + Playwright
    Preconditions: Desktop app built and running
    Steps:
      1. Launch desktop app
      2. Enter API key in settings
      3. Create new project
      4. Type prompt "A dark login form" and generate
      5. Verify HTML node appears on canvas
      6. Select node, click export as Tailwind
      7. Verify export output
      8. Quit and relaunch — verify state persisted
    Expected Result: All 8 steps complete successfully
    Evidence: .sisyphus/evidence/task-20-e2e-flow.txt

  Scenario: Error states handled gracefully
    Tool: Bash (curl)
    Steps:
      1. Generate without API key → expect 400 error with message
      2. Generate with invalid key → expect 401 error
      3. Export non-existent design → expect 404
    Expected Result: All error states return appropriate HTTP status and message
    Evidence: .sisyphus/evidence/task-20-error-handling.txt
  ```

  **Commit**: YES
  - Message: `feat: end-to-end desktop integration`
  - Files: Cross-app changes
  - Pre-commit: `turbo validate`

- [ ] 21. UI Polish + Dark Mode + Responsive Canvas

  **What to do**:
  - Polish the UI for production quality:
    - Ensure dark mode is default and consistent across all components
    - Verify shadcn/ui theming tokens are applied correctly
    - Add loading states for async operations (generation, export)
    - Add empty states (no projects, no designs on canvas)
    - Verify canvas responsiveness (resize, minimum size)
    - Add subtle animations (panel transitions, node placement)
  - Verify Tailwind v4 CDN links in AI-generated HTML
  - Test on different viewport sizes
  - Ensure accessibility basics (keyboard navigation, focus management)

  **Must NOT do**:
  - Do NOT add new features
  - Do NOT redesign the UI — polish what exists
  - Do NOT add complex animations (keep them subtle)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI/UX polish work
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20, 22)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 15 (canvas implementation)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dark mode is consistent across all views
    Tool: Playwright
    Steps:
      1. Navigate through all pages/features
      2. Take screenshots of each state
      3. Verify no light-mode artifacts
    Expected Result: All views consistently dark-themed
    Evidence: .sisyphus/evidence/task-21-dark-mode/

  Scenario: Loading and empty states render
    Tool: Playwright
    Steps:
      1. Clear all projects → verify empty state
      2. Trigger generation → verify loading indicator
      3. Verify no flash of unstyled content
    Expected Result: Graceful empty and loading states
    Evidence: .sisyphus/evidence/task-21-states.png
  ```

  **Commit**: YES
  - Message: `style: UI polish and dark mode consistency`
  - Files: `apps/web/`
  - Pre-commit: `turbo typecheck --filter=@app/web`

- [ ] 22. Final Testing + Coverage Enforcement + Bug Fixes

  **What to do**:
  - Run full test suite: `turbo test`
  - Enforce coverage thresholds:
    - packages/shared: ≥70%
    - apps/server features: ≥50%
    - apps/web: E2E coverage for all user flows
  - Fix any failing tests or coverage gaps
  - Run `turbo validate` (format + lint + typecheck + test) — must pass
  - Run full E2E test suite via Playwright
  - Fix any bugs discovered during testing
  - Verify all QA scenarios from all tasks pass

  **Must NOT do**:
  - Do NOT add new features to pass coverage (only test existing code)
  - Do NOT lower coverage thresholds to make tests pass

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Testing, debugging, and quality enforcement
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20, 21)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 14-19

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full validation pipeline passes
    Tool: Bash
    Steps:
      1. Run: `turbo validate`
      2. Verify exit code 0
    Expected Result: format + lint + typecheck + test all pass
    Evidence: .sisyphus/evidence/task-22-validate.txt

  Scenario: Coverage thresholds met
    Tool: Bash
    Steps:
      1. Run: `turbo test -- --coverage`
      2. Verify shared ≥70%, server features ≥50%
    Expected Result: Coverage thresholds met for all packages
    Evidence: .sisyphus/evidence/task-22-coverage.txt
  ```

  **Commit**: YES
  - Message: `test: final testing, coverage enforcement, and bug fixes`
  - Files: Various
  - Pre-commit: `turbo validate`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `turbo typecheck` + `turbo lint` + `turbo test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, unused imports. Check AI slop: excessive comments, over-abstraction.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ Playwright)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Test edge cases: empty state, invalid API key, large canvas. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read spec, read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Worktree & Merge Policy

> **CRITICAL**: `/start-work` AUTO-MERGES worktree into current branch after completion.
> **DO NOT use `/start-work` for parallel tasks — it auto-merges big changes that the user must manually review and merge.

> 
> **`/ralph-loop`** does NOT merge — stays on branch. Agent self-verifies via completion promise. Good for well-defined tasks.
> **`/ulw-loop`** does NOT merge — stays on branch. Oracle verifies before exit. Good for complex tasks needing independent quality verification

> 
> **SQUASH MERGE POLICY (MANDATORY)**:
> - **Feature branches → `develop`**: ALWAYS use `git merge --squash`. No exceptions.
> - **Release branches → `main`**: ALWAYS use `git merge --squash`. No exceptions.
> - This keeps both `develop` and `main` history clean — one commit per logical unit (task or release).
> 
> **Post-squash version bump workflow**:
> 1. `git checkout develop && git merge --squash feature/<task-slug>`
> 2. Review the staged changes
> 3. Commit with conventional commit message (enforced by commitlint)
> 4. Author a changeset: `bun changeset` — describe the change and bump level
> 5. Apply version bump: `bun version` (runs `changeset version`)
> 6. Commit version bump: `git commit -m "chore: version bump to 0.X.Y"`
> 
> **Why squash merges**: The plan includes significant refactoring and new features. Squash merges make each change atomic and traceable to a specific version bump. Combined with changesets, this gives you a clean changelog where each entry maps to one logical unit of work.

> 
> **All task branches stay open until user manually reviews and squash-merges into `develop` (not `main`).**

> 
> **DO NOT auto-merge into `main`** — branches contain big changes
> Each task runs in its own isolated worktree with itsfeature/<task-slug>` from develop` branch
> Squash-merge into `develop` (not `main`) only after explicit user approval
> 
> **Branch naming Convention**: `feature/<task-slug>` (e.g., `feature/canvas`)

> **Worktree Directory**: `.worktrees/` (project-local, hidden)
> **Example workflow**:
  ```bash
  # From develop branch
  git worktree add .worktrees/canvas -b feature/canvas
  # In worktree
  bun install
  # Run baseline tests
  # Work on feature in worktree
  # Finish work: commit, worktree branch, squash-merge into develop
  # Review changes and PR, create if needed
  git checkout develop
  git merge --squash feature/canvas
  # Review staged changes, then commit
  git commit -m "feat(canvas): implement React Flow canvas with design nodes"
  # Author changeset
  bun changeset
  bun version
  git commit -m "chore: version bump"
  ```
> 
> **`packages/desktop`**: Confirmed as standardized path (not `platforms/desktop`)

> **Post-Merge**: NO AUTO-MERGE. Branches stay open for manual review then squash-merge into `develop` (not `main`).
> 
> **Task 0**: `chore: rebrand Otto → Gosto and change license to AGPLv3` (direct commit on `develop`)

> **Task 1-2** (deep analysis): `ulw-loop` (Oracle verifies PRD/MADR quality)
> **Task 3** (v2 PRD + tools): `ralph-loop` (Well-defined documentation and tooling setup)
> **Task 4-4b, 6-8, 12-13, 16, 18, 21-22** (well-defined tasks): `ralph-loop` (Scaffolding/config/CRUD)
> **Task 5, 9-11, (complex): `ulw-loop` (Oracle verifies schema schemas, server/web/desktop wiring)
> **Task 14-15, 17, 19-20** (complex features): `ulw-loop` (Oracle verifies core functionality)
> **F1-F4** (Verification reviews): Direct dispatch (one-shot review tasks)

> 
> **Backlog.md Registration**: Required before work begins
  - `backlog task create "<Task Name>"` in Backlog.md
  - Work in isolated worktree: `feature/<task-slug>` in develop` branch
  - Example: `backlog task create "Scaffold Hono server" -a feature/hono+VSA`
  - Verify: all 8 MVP features are in backlog

  - After task completion: update status in Backlog.md
  - Commit in worktree: `git commit -m "feat: <branch-name>"`

  - Squash-merge into develop: `git checkout develop && git merge --squash <worktree-branch>`
  - Author changeset: `bun changeset`
  - Apply version: `bun version`
  - Review changes
  PR to develop if needed
> - **Example**: `backlog task create "Add Canvas feature" -l auth, -d feature/canvas`
> - `backlog task create "Scaffold TanStack Start app" -l TanStack-Start`
> - `backlog task create "Scaffold shared Package" -l shared contracts`
> - ...etc

- **Commit Message**: `type(scope): description` (wave-level grouping)

- **Pre-commit**: `turbo validate`- **Wave 1**: `docs(analysis): add original and POC PRDs and MADRs` — docs/prd-original.md, docs/prd-poc.md, docs/decisions/
- **Wave 2**: `chore: initialize bun workspace monorepo with turborepo` — root configs, packages/shared, apps/
- **Wave 2**: `chore: set up version management with changesets and conventional commits` — .changeset/, commitlint, hooks, CHANGELOG.md
- **Wave 3**: `feat(server): scaffold hono server with VSA file contracts` — apps/server/
- **Wave 3**: `feat(web): scaffold tanstack start app with FSD file contracts` — apps/web/
- **Wave 3**: `feat(desktop): scaffold electrobun desktop shell` — packages/desktop/
- **Wave 4**: `feat(pipeline): implement AI generation via mastra workflow` — apps/server/src/features/generate/
- **Wave 4**: `feat(canvas): implement react flow canvas with design nodes` — apps/web/src/features/canvas/
- **Wave 4**: `feat(projects): implement project CRUD with sqlite persistence` — apps/server/src/features/projects/
- **Wave 4**: `feat(export): implement tailwind/react/svg export` — apps/server/src/features/export/
- **Wave 4**: `feat(settings): implement BYOK settings with model selection` — apps/server/src/features/settings/
- **Wave 4**: `feat(desktop): wire electrobun to spawn server and load webview` — packages/desktop/
- **Wave 5**: `feat: end-to-end desktop integration` — cross-app wiring
- **Wave 5**: `style: ui polish and dark mode` — apps/web/

---

## Success Criteria

### Verification Commands
```bash
bun install                           # Expected: success, zero errors
turbo build                           # Expected: all packages build
bun validate                          # Expected: ✅ lint, ✅ format, ✅ types, ✅ tests
turbo test -- --coverage              # Expected: all pass, ≥70% shared coverage
```

### Verification Commands
```bash
bun install                           # Expected: success, zero errors
turbo build                           # Expected: all packages build
bun validate                          # Expected: ✅ lint, ✅ format, ✅ types, ✅ tests
turbo test -- --coverage              # Expected: all pass, ≥70% shared coverage
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All tests pass with required coverage
- [ ] Desktop app launches and renders canvas
- [ ] AI generation produces HTML/CSS from text prompt
- [ ] Projects persist across app restarts
- [ ] Export produces valid Tailwind/React/SVG output
- [ ] Cross-package import rules enforced (no violations)
- [ ] AGENTS.md with progressive disclosure in place
- [ ] CI/CD pipeline running on GitHub Actions
- [ ] Version management active (changesets + commitlint + git hooks)
- [ ] Backlog.md initialized with tasks
- [ ] OpenSpec configured with initial specs
- [ ] `bun validate` produces clean ✅ output for lint/format/types/tests
- [ ] All tests pass with required coverage
- [ ] `bun validate` produces clean ✅ output
- [ ] Desktop app launches and renders canvas
- [ ] AI generation produces HTML/CSS from text prompt
- [ ] Projects persist across app restarts
- [ ] Export produces valid Tailwind/React/SVG output
- [ ] Cross-package import rules enforced (no violations)
- [ ] AGENTS.md with progressive disclosure in place
- [ ] CI/CD pipeline running on GitHub Actions
- [ ] Version management active (changesets + commitlint + git hooks)
- [ ] Backlog.md initialized with tasks
- [ ] OpenSpec configured with initial specs
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All tests pass with required coverage
- [ ] Desktop app launches and renders canvas
- [ ] AI generation produces HTML/CSS from text prompt
- [ ] Projects persist across app restarts
- [ ] Export produces valid Tailwind/React/SVG output
- [ ] Cross-package import rules enforced (no violations)
- [ ] AGENTS.md with progressive disclosure in place
- [ ] CI/CD pipeline running on GitHub Actions
- [ ] Version management active (changesets + commitlint + git hooks)
- [ ] Backlog.md initialized with tasks
- [ ] OpenSpec configured with initial specs
- [ ] `bun validate` produces clean ✅ output for lint/format/types/tests
