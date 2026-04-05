# Product Requirements Document — Otto Canvas (Original)

> This PRD describes the original Otto Canvas application as it existed at commit `015ad63` on the `develop` branch, prior to the Gosto rebranding. It serves as the baseline reference for the project reset.

---

## 1. Problem Statement

Designing UI components, marketing assets, and full-page layouts requires specialized skills (Figma, CSS, visual design) and significant time. Non-designers—developers, product managers, marketers—often need quick visual concepts but lack the tools or expertise to produce them. Even experienced designers spend hours iterating on variations.

**Otto Canvas** solves this by providing an AI-powered design tool where users describe what they want in natural language and receive multiple polished HTML/CSS design variations on an infinite canvas, then iterate through conversational comments.

---

## 2. Target Users

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **Frontend Developers** | Engineers who need UI mockups before coding | Rapid visual prototyping, component design exploration |
| **Product Managers** | Non-technical stakeholders defining product requirements | Visual communication of feature ideas, landing page concepts |
| **Marketers** | Teams creating social ads, banners, email headers | Quick marketing asset generation without design team dependency |
| **Startup Founders** | Solo entrepreneurs building MVPs | Affordable design iteration without hiring designers |
| **Design-curious Individuals** | Anyone exploring visual design ideas | Low-barrier entry to design creation ("vibe designing") |

---

## 3. User Stories

### Core Generation

1. **US-001: Generate design from text prompt**
   As a user, I want to type a natural language description of a design and receive multiple visual variations, so I can explore different creative directions without manual design work.

2. **US-002: Sequential critique loop**
   As a user, I want each design variation to improve upon the previous one, so the AI learns from its own output and produces progressively better results.

3. **US-003: Quick parallel mode**
   As a user, I want to generate all variations in parallel instead of sequentially, so I can get results faster when quality iteration is less critical.

### Canvas & Layout

4. **US-004: Infinite canvas navigation**
   As a user, I want to pan, zoom, and scroll an infinite canvas (Figma-style), so I can organize and view many design variations spatially.

5. **US-005: Adaptive frame sizing**
   As a user, I want design frames to automatically size themselves to match the design type (wide for navbars, tall for pages, square for cards), so outputs look proportionally correct.

6. **US-006: Reference image context**
   As a user, I want to drag-and-drop reference images onto the canvas that the AI uses as visual context, so generated designs can incorporate my existing brand assets.

### Iteration & Refinement

7. **US-007: Click-to-comment revision**
   As a user, I want to click on any part of a design and leave a comment requesting a specific change, so the AI can revise only that aspect while preserving the rest.

8. **US-008: Comment thread conversations**
   As a user, I want to reply within comment threads for ongoing back-and-forth with the AI designer, so I can iteratively refine a specific area through conversation.

9. **US-009: Remix with presets**
   As a user, I want one-click remix options ("different colors", "different layout", "more minimal", "more bold"), so I can quickly explore alternatives without writing new prompts.

### Multi-Model Pipeline

10. **US-010: Multi-model image generation**
    As a user, I want AI-generated images automatically composited into my designs (via Gemini, DALL-E, or Unsplash), so designs look polished with real photography rather than placeholder boxes.

11. **US-011: Visual QA review**
    As a user, I want the AI to automatically review generated designs for typography, spacing, color, and layout quality, so common issues are fixed before I see the result.

### Settings & Configuration

12. **US-012: Bring Your Own Key (BYOK)**
    As a user, I want to provide my own Anthropic, Gemini, Unsplash, and OpenAI API keys, so I control costs and am not locked into a hosted pricing model.

13. **US-013: Model selection**
    As a user, I want to choose between Claude model tiers (Opus 4.6, Sonnet 4.5, Opus 4, Sonnet 4), so I can balance quality vs. speed vs. cost for my use case.

14. **US-014: Design presets**
    As a user, I want built-in system prompt presets (UI/UX Design, Marketing Website, Brand/Ad Design), so the AI tailors its output style to my specific use case.

### Export & Persistence

15. **US-015: Multi-format export**
    As a user, I want to export designs as SVG, PNG, JPG, Tailwind CSS, React components, or copy as image, so I can use the output in my development workflow.

16. **US-016: Session persistence**
    As a user, I want my canvas state, API keys, settings, and design iterations to persist across browser sessions, so I don't lose work when I close the tab.

17. **US-017: Canvas file export/import**
    As a user, I want to export and import the entire canvas state as a `.otto` file, so I can share designs or archive work.

### Onboarding & Usability

18. **US-018: Guided onboarding**
    As a new user, I want a guided tour that shows me key features (prompt bar, canvas controls, comment mode, export), so I can be productive immediately.

19. **US-019: Prompt library**
    As a user, I want pre-built prompts organized by category (UI Components, Full Pages, Marketing), so I can quickly start generating without composing prompts from scratch.

20. **US-020: Keyboard shortcuts**
    As a power user, I want keyboard shortcuts (V for select, C for comment, Space+drag for pan, Ctrl+scroll for zoom, Delete for remove), so I can work efficiently.

---

## 4. Functional Requirements

### FR-1: AI Design Generation Pipeline
- Accept natural language prompt from user
- Call `/api/plan` to determine concept count (2-6) and visual style directions
- For each concept, execute a 4-stage pipeline:
  1. **Layout** (`/api/pipeline/layout`) — Claude generates HTML/CSS with size hints and image placeholders
  2. **Images** (`/api/pipeline/images`) — Gemini/DALL-E/Unsplash fills placeholder divs with real images
  3. **Review** (`/api/pipeline/review`) — Claude performs visual QA and auto-fixes issues
  4. **Critique** (`/api/pipeline/critique`) — Claude generates improvement feedback for the next variation
- Support sequential mode (critique feeds into next) and parallel quick mode
- Support revision mode (edit existing design based on user comment)
- Support context images (dragged onto canvas) as visual reference

### FR-2: Infinite Canvas
- CSS transform-based pan/zoom with `translate()` + `scale()`
- Wheel events: Ctrl/Cmd+scroll for zoom, plain scroll for pan
- Zoom clamp: 0.1x to 5x
- Auto-zoom-to-fit after generation completes
- Grid-based positioning for generated frames (2 columns, centered)
- Rubber band selection for multi-select

### FR-3: Design Frames (DesignCard)
- Render AI-generated HTML/CSS inside sandboxed iframes (`srcdoc`)
- Auto-measure iframe content height for adaptive sizing
- Frame dimensions from AI size hints (`<!--size:WxH-->`)
- Drag-to-reposition frames on canvas
- Multi-select with Shift+click or rubber band
- Delete selected frames with Delete/Backspace
- Remix menu with preset prompts
- Export menu per frame (SVG, PNG, JPG, Tailwind, React, Copy)

### FR-4: Comment System
- Comment mode (C key) enables crosshair cursor
- Click on frame to place comment pin at relative position
- Comment input appears as floating overlay at screen coordinates
- Comments have: id, position, text, number, status (waiting/working/done), thread
- Comment threads support user messages and AI responses
- Comment revision queue processes sequentially
- AI response updates frame HTML in-place

### FR-5: Settings & API Key Management
- Settings stored in localStorage (`otto-settings` key)
- Configurable: Anthropic API key, Gemini key, Unsplash key, OpenAI key
- Model selection from predefined list
- System prompt with preset options (UI/UX, Marketing, Brand/Ad)
- Concept count (2-6, default 4)
- Quick mode toggle (parallel vs. sequential generation)
- Show zoom controls toggle

### FR-6: Session Persistence
- Design groups persisted to localStorage (`otto-canvas-session` key)
- Base64 images extracted from HTML and stored in IndexedDB (`otto-canvas-images`)
- Canvas reference images persisted in IndexedDB (max 20, compressed to 800px JPEG 60%)
- Onboarding state persisted in localStorage (`otto-onboarding`)
- Debounced saves (500ms) to prevent performance issues

### FR-7: Export System
- **SVG**: Client-side HTML-to-SVG via `foreignObject` wrapping
- **PNG/JPG**: Client-side HTML-to-image via hidden iframe + `html-to-image` / `html2canvas-pro`
- **Tailwind CSS**: AI-powered conversion via Claude (`/api/export` with format=tailwind)
- **React Component**: AI-powered conversion via Claude (`/api/export` with format=react)
- **Copy as Image**: Clipboard API with PNG blob
- **Canvas file** (`.otto`): Full JSON export/import of canvas state

---

## 5. Non-Functional Requirements

### NFR-1: Performance
- Canvas pan/zoom must feel smooth (CSS transforms with `will-change: transform`)
- Streaming layout generation with keepalive pings (every 5s) to avoid Vercel function timeouts
- Debounced state persistence (500ms)
- Image compression for storage (max 1024px for API, 800px for IndexedDB, 128px thumbnails)

### NFR-2: Scalability
- Client-side architecture — no server state, no database
- API routes are stateless proxies to AI providers
- Max function duration: 300s for pipeline routes, 30s for plan/critique

### NFR-3: Security
- API keys stored client-side in localStorage (BYOK model)
- Server-side fallback via `ANTHROPIC_API_KEY` env var for demo mode
- HTML rendered in sandboxed iframes (origin isolation)

### NFR-4: Usability
- Zero-config start — no account, no database, no deployment required
- Guided onboarding for new users
- Prompt library for quick starts
- Keyboard shortcuts for power users
- Pipeline status overlay showing generation progress per frame

### NFR-5: Compatibility
- Modern browsers only (ES modules, CSS transforms, IndexedDB, Clipboard API)
- No mobile-optimized UI (desktop tool)
- Self-contained HTML/CSS output (system font stack, no external dependencies)

---

## 6. Technical Considerations

### Architecture
- **Single-page application** built with Next.js 15 App Router
- **One monolithic page component** (`src/app/page.tsx`, ~1355 lines) managing all state
- **API routes** as thin serverless proxies to AI providers
- **No database** — all persistence via localStorage + IndexedDB
- **No authentication** — BYOK model with client-side API keys

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Language | TypeScript | 5.x |
| AI - Layout & QA | Anthropic SDK (Claude) | 0.74.x |
| AI - Images | Google GenAI SDK (Gemini) | 1.41.x |
| Canvas Gestures | Custom implementation | — |
| HTML-to-Image | html-to-image, html2canvas-pro | — |

### API Surface
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/plan` | POST | Generate concept plan (count + style directions) |
| `/api/generate` | POST | Legacy single-shot generation |
| `/api/pipeline/layout` | POST | Generate HTML/CSS layout via Claude |
| `/api/pipeline/images` | POST | Fill image placeholders via Gemini/DALL-E/Unsplash |
| `/api/pipeline/review` | POST | Visual QA review via Claude |
| `/api/pipeline/critique` | POST | Generate improvement critique via Claude |
| `/api/export` | POST | Convert HTML to Tailwind/React/SVG |
| `/api/probe-models` | POST | Check which Claude models are available |

### Data Model
- **GenerationGroup**: id, prompt, iterations[], position, createdAt
- **DesignIteration**: id, html, label, position, width, height, prompt, comments[], isLoading, isRegenerating
- **Comment**: id, position, text, number, resolved?, createdAt, status?, aiResponse?, thread?
- **CanvasImage**: id, dataUrl, name, width, height, position, thumbnail
- **Settings**: apiKey, geminiKey, unsplashKey, openaiKey, model, systemPrompt, systemPromptPreset, conceptCount, quickMode, showZoomControls

---

## 7. Out of Scope

The following are explicitly **not** part of the original Otto Canvas:

- **User accounts or authentication** — No login, no user profiles, no team management
- **Server-side persistence** — No database, no cloud storage, no sync
- **Real-time collaboration** — Single-user tool, no multi-user editing
- **Version history** — No undo/redo beyond browser session
- **Component library management** — No saving/reusing generated components
- **Design system enforcement** — No shared color palettes, typography scales, or tokens beyond per-prompt instructions
- **Mobile support** — Desktop-only experience
- **Accessibility compliance** — No WCAG audit or screen reader support
- **Internationalization** — English-only UI
- **Automated testing** — No unit tests, integration tests, or E2E tests
- **CI/CD pipeline** — Manual deployment
- **Analytics** — Optional Google Analytics via env var, no product analytics
