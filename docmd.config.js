// docmd — end-user documentation site, served at calca.illo.fyi/docs/
// Source lives in docs/ (USER docs only; internal/dev docs live in .agents/docs).
export default {
  title: "Calca Docs",
  url: "https://calca.illo.fyi/docs/",
  src: "docs",
  out: "apps/landing/dist/docs",
  base: "/docs/",
  // Internal docs still present in docs/ until they are moved to .agents/docs —
  // exclude them so they never ship in the user docs site.
  exclude: [
    "PRD.md",
    "adrs/**",
    "poc-learnings.md",
    "desktop-*.md",
    "versioning.md",
    "testing/**",
    "assets/screenshot.png",
  ],
  navigation: [
    { title: "Overview", path: "/", icon: "home" },
    { title: "Quick start", path: "/quickstart", icon: "rocket" },
    { title: "Providers & BYOK", path: "/providers", icon: "key-round" },
    { title: "Formats & presets", path: "/presets", icon: "layout-template" },
    { title: "Agents & MCP", path: "/mcp", icon: "bot" },
    { title: "Desktop app", path: "/desktop", icon: "monitor-down" },
    { title: "calca.illo.fyi", path: "https://calca.illo.fyi", icon: "arrow-left", external: true },
    { title: "GitHub", path: "https://github.com/espetro/calca", icon: "github", external: true },
  ],
  logo: {
    light: "assets/logo.png",
    dark: "assets/logo.png",
    href: "https://calca.illo.fyi",
    alt: "calca",
    height: "28px",
  },
  theme: {
    // Upstream bug (docmd-io/docmd#209): the AI-assistant widget cannot be
    // disabled via config — hide its mounted root until a relay is wired.
    customCss: ["assets/brand.css"],
  },
};
