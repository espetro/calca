# Desktop Auto-Update Mechanism

## Overview

The Calca desktop app checks for updates on startup by comparing the local version against the latest GitHub Release.

## Version Source

- **Local**: `apps/Resources/version.json` → `{"version": "0.3.0"}`
- **Remote**: GitHub Releases API `GET /repos/{owner}/{repo}/releases/latest`
- **Comparison**: Parse semver from both, update available if remote > local

## Update Check Flow

1. App starts → `platforms/desktop/src/index.ts` reads `version.json`
2. Fetch `https://api.github.com/repos/{owner}/{repo}/releases/latest`
3. Parse release tag (`v0.3.0` → `0.3.0`) and compare semver
4. If newer: set `globalThis.__CALCA_UPDATE_AVAILABLE__ = true` and store new version
5. Web app reads `globalThis` state and shows update banner/notification
6. User clicks "Update" → opens GitHub Release download page in default browser

## Release Manifest

Each GitHub Release must include:

| Asset | Format | Required |
|-------|--------|----------|
| `Calca-mac-arm64.dmg` | DMG installer (Apple Silicon) | Yes |
| `Calca-mac-x64.dmg` | DMG installer (Intel) | Yes |
| `checksums.txt` | SHA256 checksums for both DMGs | Yes |

Release tag format: `v{major}.{minor}.{patch}` (e.g., `v0.3.0`)

## Security

- DMGs must be code-signed with Apple Developer certificate
- Notarized via `xcrun notarytool` for Gatekeeper compliance
- Checksums verified before install prompt
- Only official GitHub Releases are trusted (no third-party mirrors)

## Implementation Notes

- Auto-update check is non-blocking — app starts immediately, check runs in background
- Network failures are silently ignored (no error dialog)
- Update notification is dismissible — won't show again until next app restart
- No forced updates — user always chooses when to update

## CI/CD Integration

On tag push `v*`:
1. Build desktop app (`platforms/desktop/scripts/build.sh`)
2. Generate SHA256 checksums
3. Create GitHub Release with tag, release notes, and DMG assets
4. Publish `checksums.txt` as release asset
