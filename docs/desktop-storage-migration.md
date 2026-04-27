# Desktop Storage Migration Plan

## Current State

All app data lives in browser `localStorage`:
- **Settings**: provider, model, API keys, theme, analytics toggle
- **Canvas**: designs, comments, positions, viewport state
- **AI Pipeline**: prompt history, generation results

## Target State (Desktop)

```
~/Library/Application Support/Calca/
├── settings.json              # Non-sensitive app settings
├── projects/
│   ├── {projectId}.json       # Canvas/project data
│   └── ...
└── cache/
    └── ...                    # Temporary files, image cache

API keys stored in macOS Keychain:
  Service: com.calca.desktop
  Accounts: anthropic, google
```

## Migration Strategy

### Phase 1: Dual Storage (v0.1)

- Read from `localStorage`, write to both `localStorage` AND file system
- On first desktop launch, run one-time migration script
- Web app continues using `localStorage` for cross-platform compatibility
- Migration script runs atomically: write all files, verify, then flag as complete

### Phase 2: File-First (v0.2)

- Read from file system, fallback to `localStorage` if file missing
- Write to file system only (stop writing to `localStorage`)
- Web app uses in-memory state synced with file system via FS watcher or polling

### Phase 3: Native Only (v1.0)

- Remove `localStorage` dependency entirely
- All data in native file system
- API keys in Keychain exclusively
- No web app `localStorage` code remains

## Migration Script

Runs once on first desktop launch, triggered by `version.json` migration flag:

1. Check `~/Library/Application Support/Calca/.migrated` flag
2. If not migrated:
   a. Read all `localStorage` keys via webview evaluation
   b. Parse and categorize: settings, projects, cache
   c. Write `settings.json` (excluding API keys)
   d. Write project files to `projects/` directory
   e. Store API keys in Keychain via `security` CLI
   f. Write `.migrated` flag with source version
3. If migration fails: keep `localStorage` intact, log error, show error dialog

## Keychain Integration

```bash
# Store API key
security add-generic-password \
  -s "com.calca.desktop" \
  -a "anthropic" \
  -w "$ANTHROPIC_API_KEY"

# Retrieve API key
security find-generic-password \
  -s "com.calca.desktop" \
  -a "anthropic" \
  -w
```

## Rollback Strategy

- Never delete `localStorage` until file write is verified
- If migration fails, show dialog: "Migration failed. Your data is safe. Retry?"
- On retry, skip already-migrated items
- Manual rollback: delete `~/Library/Application Support/Calca/` and `.migrated` flag

## Testing Checklist

- [ ] Fresh install (no `localStorage`) → creates file structure with defaults
- [ ] Migrated install (has `localStorage`) → migrates all data successfully
- [ ] Partial migration failure → rolls back gracefully, no data loss
- [ ] Settings change after migration → persists to file system
- [ ] API key retrieval from Keychain → works correctly
- [ ] Web app after migration → reads from file system, not `localStorage`
