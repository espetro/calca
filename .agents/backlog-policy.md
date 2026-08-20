# Backlog Policy

GitHub Project: https://github.com/users/espetro/projects/6

## Refined task fields

- **Milestone** — maps to iteration/quarter (e.g. `2026 Q3`). Create the milestone in the repo if it doesn't exist yet.
- **Size** — effort estimate: `XS`/`S`/`M`/`L`/`XL`. Include testing + bug potential per contact surface.
- **Start date** / **Target date** — scheduled window for the task.
- **Label** — classification, drives client positioning: `feature`, `bug`, `cosmetic`, `infra`. Create the label in the repo if it doesn't exist yet.

## Workflow

1. Create a GitHub issue in `espetro/calca` with title, body, classification label, milestone.
2. Add it to project 6: `gh project item-add 6 --owner espetro --url <issue-url>`.
3. Set Size/Start date/Target date via `gh project item-edit --project-id <id> --id <item-id> --field-id <field-id> ...`.
4. Reference the issue number in the PR description and in the corresponding `.agents/plans/` doc.

No orphan work: every plan/implementation must link back to a refined task here.
