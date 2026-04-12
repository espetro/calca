# E2E Test Specs

Tests use **Gauge** (Markdown specs) + **agent-browser** (browser execution).
Steps are defined in `e2e/steps/`. Run with `bun run test:e2e`.

## Writing a spec

Create a `.md` file in `e2e/specs/`. Each H1 is a feature, each H2 is a scenario.

```markdown
# Checkout Flow

## Guest user can add item to cart
* Open "http://localhost:3000/shop"
* Click "Add to Cart"
* Page should contain "1 item in cart"

## Logged-in user sees saved address
* Open "http://localhost:3000/checkout"
* Page should contain "123 Main St"
```

## Built-in steps (e2e/steps/common.ts)

| Step | Description |
|------|-------------|
| `Open <url>` | Navigate to URL |
| `Click <label>` | Click element matching label |
| `Click the <label> button` | Same, button-scoped |
| `Fill <value> in the <label> field` | Type into input |
| `Select <value> in the <label> dropdown` | Select option |
| `Page should contain <text>` | Assert visible text |
| `Page should not contain <text>` | Assert absence |
| `Wait for <label> to appear` | Poll up to 5s |

Parameters use `<angle brackets>` inline. Values with spaces must be quoted in the step text.

## Adding new steps

Add a new file in `e2e/steps/` and export a class with `@Step` decorators. Import `snapshot`, `findRef`, and `ab` from `../support/ab`.

```typescript
import { Step } from 'gauge-ts';
import { ab, snapshot, findRef } from '../support/ab';

export default class ProfileSteps {
  @Step("Upload avatar from <path>")
  async uploadAvatar(path: string) {
    const snap = snapshot();
    const ref = findRef(snap, 'avatar');
    ab(`fill ${ref} "${path}"`);
  }
}
```

## Naming conventions

- Spec files: `e2e/specs/<feature-name>.md` (kebab-case)
- Step files: `e2e/steps/<feature-name>.ts` (matching the spec)
- Group generic cross-feature steps in `common.ts`

## agent-browser refs

Refs (`@e1`, `@e2`) are ephemeral — they reset on navigation or DOM mutation.
Always call `snapshot()` immediately before each interaction, never cache refs across steps.

## Running tests

```bash
bun run test:e2e                          # all specs
bun run test:e2e:spec e2e/specs/login.md  # single spec
```
