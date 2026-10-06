# Desktop Releases & Updates

How the Electrobun desktop app is built, signed, distributed, and updated.

Merged from `desktop-distribution.md` + `desktop-auto-update.md`, corrected against
`platforms/desktop/src/updater.ts`, `electrobun.config.ts`, and
`.github/workflows/desktop.yml`.

## Release pipeline

`.github/workflows/desktop.yml` builds the app on `macos-latest` (dmg) and
`windows-2025` (zip) for pushes to `main`, `v*` tags, and `workflow_dispatch`:

1. `bun run build:desktop` — web build → copy to `Resources/web/` → `electrobun build`
2. On `v*` tags, `softprops/action-gh-release` publishes `artifacts/**/*.dmg` and
   `artifacts/**/*.zip` with generated release notes

Users download installers from GitHub Releases directly.

## Signing & notarization

macOS builds are signed and notarized in CI (`electrobun.config.ts`:
`codesign: true`, `notarize: isCI`). Required GitHub secrets (see the workflow
header for setup steps):

- `MACOS_CERTIFICATE_BASE64` / `MACOS_CERTIFICATE_PASSWORD` — Developer ID .p12
- `APPLE_API_ISSUER`, `APPLE_API_KEY_ID`, `APPLE_API_KEY_P8_BASE64` — App Store
  Connect API key for notarization
- `APPLE_DEVELOPER_ID` — full certificate name

Windows builds are unsigned today.

## Auto-update mechanism

Uses Electrobun's built-in `Updater` API — **not** a hand-rolled GitHub API
check. The update feed is `release.baseUrl` in `electrobun.config.ts`
(`github.com/espetro/calca/releases/latest/download`), which Electrobun polls
for an update manifest alongside the release assets.

Flow (`src/updater.ts`, `src/index.ts`):

1. On startup and every hour, `checkAndNotify(win)` calls `Updater.checkForUpdate()`
2. State is pushed to the webview via `window.__calcaUpdaterStateCallback({state, version, currentVersion})` —
   the `UpdateNotification` widget (`apps/web/src/widgets/update-notification/`) renders it
3. User action triggers RPC handlers `updater__startDownload` → `Updater.downloadUpdate()`
   (progress pushed as `downloading`) and `updater__apply` → `Updater.applyUpdate()`
4. States: `available` → `downloading` → `ready`

Notes:

- The check is non-blocking and failures are logged, never raised to the user
- Dev-mode detection uses `Updater.localInfo.channel()` (`dev`), not `NODE_ENV`
- `window.__CALCA_UPDATE_AVAILABLE__`/`__CALCA_UPDATE_VERSION__` are declared on
  the Window type for compatibility; the live path is the callback above

## Distribution channel feasibility

| Channel | Feasibility | Notes |
| ------- | ----------- | ----- |
| GitHub Releases | Current | Direct dmg/zip download; Electrobun updater feed |
| Homebrew Cask | High | Single cask file pointing at the release dmg; phase 2 post-v1.0 |
| Mac App Store | Low | Review + sandboxing blocks the embedded `Bun.serve` localhost server; revisit only if Electrobun gains sandbox support |
| Sparkle | Medium | Redundant while Electrobun's updater works; re-evaluate only if the built-in updater proves limiting |
| Linux (Flatpak/Snap/AppImage) | Not planned | Desktop targets are macOS + Windows |

### Homebrew Cask sketch

```ruby
cask "calca" do
  version "0.3.0"
  sha256 "..."
  url "https://github.com/espetro/calca/releases/download/v#{version}/Calca-mac-arm64.dmg"
  name "Calca"
  desc "AI design tool for the desktop"
  homepage "https://github.com/espetro/calca"
  livecheck do
    url :url
    strategy :github_latest
  end
end
```

## Related

- [platforms/desktop/AGENTS.md](../../platforms/desktop/AGENTS.md) — architecture, RPC bridge, build rules
- [desktop-storage-migration.md](desktop-storage-migration.md) — proposed localStorage → native-file migration
