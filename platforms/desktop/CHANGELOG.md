# @app/electrobun

## 0.4.1

### Patch Changes

- Fix Windows desktop build path corruption and update provider tests

  - Replace zx shell commands with Bun.spawn to prevent Windows backslash escaping issues
  - Add Windows binary extension search (.cmd, .exe, .ps1) for electrobun
  - Fix provider test expectations to match pass-through behavior
  - Exclude dist/ from test discovery in CI
  - @app/server@0.3.1
