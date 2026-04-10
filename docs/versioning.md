# Versioning Workflow

This project uses **Changesets** for version management and **Conventional Commits** for commit message standardization.

## Overview

- **Changesets**: Manages version bumps and changelog generation across all workspace packages
- **Conventional Commits**: Enforces consistent commit message format for better project history
- **Automated Hooks**: Git hooks validate commit messages before they're committed

## Conventional Commit Format

All commits must follow the conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Changes to build process or dependencies
- `ci`: Changes to CI configuration files
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```bash
# Feature
git commit -m "feat(api): add user authentication endpoint"

# Bug fix
git commit -m "fix(web): resolve memory leak in canvas rendering"

# Documentation
git commit -m "docs: update versioning workflow documentation"

# Breaking change (with footer)
git commit -m "feat(core): redesign event system

BREAKING CHANGE: event listeners must now be registered with `on()` method"
```

## Changesets Workflow

### Creating a Changeset

After completing a feature or fix, create a changeset:

```bash
bunx changeset
```

Follow the prompts:
1. Select affected packages (multi-select)
2. Choose version bump type: `major`, `minor`, or `patch`
3. Add a summary of changes

This creates a `.changeset/*.md` file with your changeset information.

### Releasing a Version

When ready to release:

```bash
# Update versions and CHANGELOG.md
bunx changeset version

# Commit the version changes
git add .
git commit -m "chore: bump versions for 0.1.1"

# (Optional) Create a git tag
git tag v0.1.1
git push origin v0.1.1
```

The `changeset version` command:
- Updates package.json versions across all affected packages
- Generates/updates CHANGELOG.md entries
- Deletes consumed changeset files

### Version Bump Guidelines

- **major (X.0.0)**: Breaking changes, incompatible API changes
- **minor (0.X.0)**: New features, backward-compatible additions
- **patch (0.0.X)**: Bug fixes, backward-compatible changes

## Git Hooks

The project uses `simple-git-hooks` to enforce commit message standards:

```json
"simple-git-hooks": {
  "commit-msg": "bunx commitlint --edit $1"
}
```

This hook runs `commitlint` on every commit message to ensure it follows the conventional commit format.

### Hook Enforcement

- Commit messages are validated before the commit is created
- Non-conventional commits will be rejected
- The hook provides helpful error messages with examples

## Version Management Best Practices

### Do's

✅ Create a changeset for every significant change  
✅ Be specific in your changeset summaries  
✅ Use appropriate version bump types  
✅ Write clear, descriptive commit messages  
✅ Reference issue numbers in commit bodies when relevant  

### Don'ts

❌ Skip changesets for features or bug fixes  
❌ Use vague commit messages like "update stuff"  
❌ Bump major versions for minor changes  
❌ Manually edit CHANGELOG.md (let changesets handle it)  
❌ Ignore commit message validation errors  

## Troubleshooting

### Commit Message Fails Validation

If your commit message fails the linter:

1. Read the error message carefully
2. Adjust your commit message to follow the format
3. Try the commit again with the corrected message

Example fix:
```bash
# ❌ Invalid
git commit -m "updated the thing"

# ✅ Valid
git commit -m "feat(web): update canvas rendering performance"
```

### Changeset Not Applying

If a changeset isn't applying when you run `changeset version`:

1. Verify the changeset file exists in `.changeset/`
2. Check the file format is correct
3. Ensure the package names match workspace packages

### Version Conflicts

If you encounter version conflicts:

```bash
# Clear changesets (careful!)
rm -rf .changeset/*.md

# Or selectively delete specific changeset files
rm .changeset/problematic-changeset.md
```

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Commitlint Documentation](https://commitlint.js.org/)
