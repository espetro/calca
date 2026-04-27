# Desktop Distribution Feasibility

## Current Distribution

Direct download from GitHub Releases (DMG). Users visit the repo, download the latest DMG, and drag to Applications.

## Alternative Channels

### Homebrew Cask — HIGH Feasibility

| Aspect | Detail |
|--------|--------|
| Pros | Familiar to macOS devs, auto-updates via `brew upgrade`, simple Cask file |
| Cons | Requires Homebrew installed, cask maintenance overhead |
| Effort | Low — single Cask file pointing to GitHub Release URL |
| Code Signing | Required for Gatekeeper compliance |
| Timeline | Phase 2 (post v1.0) |

Cask file example:
```ruby
cask "calca" do
  version "0.3.0"
  sha256 "..."
  url "https://github.com/joaquindev/calca/releases/download/v#{version}/Calca-mac-arm64.dmg"
  name "Calca"
  desc "AI design tool for the desktop"
  homepage "https://github.com/joaquindev/calca"
  livecheck do
    url :url
    strategy :github_latest
  end
end
```

### Mac App Store — LOW Feasibility

| Aspect | Detail |
|--------|--------|
| Pros | Discovery, trust, auto-updates, familiar install flow |
| Cons | Apple review (2-7 days), sandboxing requirements, 15-30% fee, Bun/Electrobun compatibility unknown |
| Blocker | macOS sandboxing would prevent embedding Hono server on localhost — this is a hard blocker |
| Timeline | Not feasible without Electrobun sandbox support |

### Sparkle Framework — MEDIUM Feasibility

| Aspect | Detail |
|--------|--------|
| Pros | Industry standard for macOS auto-updates, proven reliability, delta updates |
| Cons | Additional dependency, Electrobun may have built-in update mechanism |
| Decision | Evaluate after confirming Electrobun's native update capabilities |

### Flatpak / Snap / AppImage — NOT APPLICABLE

Electrobun is macOS-only. No Linux desktop support planned.

## Recommendation

| Phase | Channel | Action |
|-------|---------|--------|
| Phase 1 (Now) | GitHub Releases | Direct DMG download, manual update |
| Phase 2 (v1.0) | Homebrew Cask | Add Cask file, `brew install --cask calca` |
| Phase 3 (Future) | Mac App Store | Re-evaluate if Electrobun supports sandboxing |

## Code Signing Requirements

All distribution channels require:
- Apple Developer Program membership ($99/year)
- Developer ID Application certificate for distribution outside App Store
- Notarization via `xcrun notarytool submit`
- Hardened Runtime entitlements
