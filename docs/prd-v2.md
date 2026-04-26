# Product Requirements Document — Calca v2

> Target PRD for the Calca v2 rebuild. Describes the minimum viable product (8 MVP features) and post-MVP roadmap based on POC learnings and architectural decisions.

---

## 1. Vision

**Calca v2** is an AI-powered design tool that lets users describe what they want in natural language and receive multiple polished HTML/CSS design variations on an infinite canvas. Unlike the original Otto Canvas, v2 introduces:

- **Server-side persistence** — SQLite database replaces fragile localStorage + IndexedDB
- **Desktop shell** — Electrobun wrapper for a native-like experience
- **Shared packages** — Modular architecture with contracts, schemas, and AI logic
- **Zustand state management** — Replace 20+ useState hooks with centralized stores
- **Improved pipeline** — Extract to shared package with better error handling and testing

The v2 rebuild is a **documentation-first, incremental refactoring** of the working Calca 1.0 codebase. No new features, just structural improvements to enable future growth.

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

## 3. MVP Features (P0)

The MVP delivers a fully functional AI design tool with server-side persistence and desktop capabilities.

### Feature 1: Canvas (CARRY + REDESIGN)
**Status**: CARRY (core), REDESIGN (state management)

**What it is**: Infinite canvas with pan/zoom/scroll (Figma-style) that hosts generated design frames.

**User Story**:
> As a user, I want to pan, zoom, and scroll an infinite canvas (Figma-style), so I can organize and view many design variations spatially.

**Functional Requirements**:
- CSS transform-based pan/zoom with `translate()` + `scale()`
- Wheel events: Ctrl/Cmd+scroll for zoom, plain scroll for pan
- Zoom clamp: 0.1x to 5x
- Auto-zoom-to-fit after generation completes
- Grid-based positioning for generated frames (2 columns, centered)
- Rubber band selection for multi-select
- Drag-to-reposition frames

**Technical Implementation**:
- Keep CSS transforms with native wheel events (proven, performant)
- Replace 20+ useState hooks with Zustand stores:
  - `useCanvasStore` — pan/zoom, viewport, zoom-to-fit
  - `useDesignStore` — groups, iterations, positions
  - `useSelectionStore` — selected IDs, rubber band
  - `useCommentStore` — comments, threads, queue

**Performance**:
- CSS transforms with `will-change: transform`
- 60fps smooth zoom
- Virtualization for 50+ frames (lazy load off-screen frames)

---

### Feature 2: AI Generation Pipeline (CARRY + REDESIGN)
**Status**: CARRY (core), REDESIGN (abstraction)

**What it is**: Multi-stage AI pipeline that generates polished HTML/CSS designs from natural language prompts.

**User Story**:
> As a user, I want to type a natural language description of a design and receive multiple visual variations, so I can explore different creative directions without manual design work.

**Functional Requirements**:
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

**Technical Implementation**:
- Extract pipeline logic to `packages/core`:
  - `prompts/` — All prompt templates as composable functions
  - `parsers/` — HTML parsing, size extraction, cleanup
  - `providers/` — SDK wrappers with retry/error handling
- Next.js API routes become thin: parse input → call core → return output
- Structured error types (AuthError, RateLimitError, TimeoutError)
- Automatic retry for transient errors
- Pipeline status overlay showing progress per frame

**Performance**:
- Streaming layout generation with keepalive pings (every 5s) to avoid Vercel function timeouts
- Debounced state persistence (500ms)
- Image compression for storage (max 1024px for API, 800px for database, 128px thumbnails)

---

### Feature 3: Projects Management (CARRY + REDESIGN)
**Status**: CARRY (core), REDESIGN (persistence)

**What it is**: CRUD operations for saving, loading, and managing design projects with SQLite persistence.

**User Story**:
> As a user, I want to save my canvas state and load it later, so I don't lose work when I close the browser tab.

**Functional Requirements**:
- Create new project (sets canvas to initial state)
- Rename project
- Delete project
- Load project (restore all frames, positions, comments)
- Auto-save every 2 minutes
- Project list view showing all saved projects

**Technical Implementation**:
- SQLite database with Drizzle ORM
- Schema:
  - `projects` — id, name, createdAt, updatedAt
  - `designs` — id, projectId, position, html, width, height, prompt, createdAt
  - `comments` — id, designId, position, text, status, thread, createdAt
  - `settings` — id, apiKeyAnthropic, apiKeyGemini, apiKeyUnsplash, apiKeyOpenAI, model, systemPromptPreset, conceptCount, quickMode
- Server-side API routes:
  - `GET /api/projects` — List all projects
  - `POST /api/projects` — Create new project
  - `GET /api/projects/:id` — Load project
  - `PUT /api/projects/:id` — Update project
  - `DELETE /api/projects/:id` — Delete project
  - `POST /api/projects/:id/preview` — Get canvas state for preview

**Performance**:
- Query optimization with indexes on foreign keys
- Pagination for project lists (10 items per page)
- Lazy loading of designs (load only visible frames)

---

### Feature 4: Pipeline (CARRY + REDESIGN)
**Status**: CARRY (core), REDESIGN (abstraction)

**What it is**: Multi-model pipeline architecture (Claude layout → image generation → visual QA) extracted to shared package.

**User Story**:
> As a user, I want AI-generated images automatically composited into my designs (via Claude, Gemini, or Unsplash), so designs look polished with real photography rather than placeholder boxes.

**Functional Requirements**:
- Multi-model image generation with fallback chain (Unsplash → DALL-E → Gemini)
- Batch processing (3 images at a time)
- Visual QA review with auto-fixes
- Sequential critique loop (each variation learns from the previous)

**Technical Implementation**:
- Extract to `packages/core`:
  - `pipeline/layout` — Claude API call with streaming, prompt templates
  - `pipeline/images` — Multi-source image generation with fallback chain
  - `pipeline/review` — Visual QA via Claude
  - `pipeline/critique` — Sequential improvement feedback
- Unified `LLMProvider` interface with SDK wrappers
- Retry logic with exponential backoff
- Health checking for AI providers
- Cache generated images in SQLite (deduplicate by prompt + image ID)

**Performance**:
- Parallel image generation (batch of 3)
- Streaming responses for layout generation
- Image compression for storage and API responses

---

### Feature 5: Export (CARRY)
**Status**: CARRY (core)

**What it is**: Multi-format export including SVG, PNG, JPG, Tailwind CSS, React components.

**User Story**:
> As a user, I want to export designs as SVG, PNG, JPG, Tailwind CSS, or React components, so I can use the output in my development workflow.

**Functional Requirements**:
- Export single design as SVG, PNG, JPG
- Export single design as Tailwind CSS
- Export single design as React component
- Export canvas as `.calca` file (JSON export of entire state)
- Copy as image to clipboard

**Technical Implementation**:
- SVG via foreignObject wrapping
- PNG/JPG via html-to-image / html2canvas-pro
- Tailwind/React via Claude API call (`/api/export`)
- JSON export of canvas state with all designs, positions, comments

**Performance**:
- Client-side rendering for SVG/PNG/JPG (no server round-trip)
- AI-powered code export with streaming response
- Defer large exports (show progress indicator)

---

### Feature 6: Settings (CARRY + REDESIGN)
**Status**: CARRY (core), REDESIGN (server-side)

**What it is**: BYOK API key management with model selection and design presets.

**User Story**:
> As a user, I want to provide my own Anthropic, Gemini, Unsplash, and OpenAI API keys, so I control costs and am not locked into a hosted pricing model.

**Functional Requirements**:
- Enter/modify API keys for:
  - Anthropic (Claude)
  - Gemini
  - Unsplash
  - OpenAI (DALL-E)
- Choose Claude model tier (Opus 4.6, Sonnet 4.5, Opus 4, Sonnet 4)
- Select design preset (UI/UX Design, Marketing Website, Brand/Ad Design)
- Configure concept count (2-6, default 4)
- Toggle quick mode (parallel vs sequential generation)
- Toggle zoom controls visibility

**Technical Implementation**:
- Settings stored in SQLite database (server-side)
- API keys encrypted at rest (using Node crypto module)
- Client fetches settings on load, sends session token (not API keys) with requests
- Settings sync across devices (if desktop shell supports cloud storage later)

**Security**:
- API keys never sent from client (stored in server, fetched by client)
- HTTPS only (server-side API keys)
- No caching of API keys in browser (fetch on demand)

---

### Feature 7: Desktop Shell (CARRY)
**Status**: CARRY (core)

**What it is**: Electrobun wrapper that launches the Calca web app with a native desktop frame.

**User Story**:
> As a user, I want Calca to run as a desktop application, so I have a native-like experience with native menus and hotkeys.

**Functional Requirements**:
- Launch Calca web app with custom window frame
- Native menus (File, Edit, View, Help)
- Native keyboard shortcuts (Ctrl+S for save, Ctrl+N for new project)
- System tray icon for background mode
- Auto-update check on launch

**Technical Implementation**:
- Electrobun desktop shell using existing Next.js app
- Custom window chrome (CSS-based, Electron-compatible)
- Native menu integration via electron-builder
- System tray via Tray API
- Desktop-specific hotkey registration (global hotkeys)

**Performance**:
- Fast startup (< 2 seconds)
- Low memory footprint (< 100MB baseline)
- Smooth window animations (CSS transforms)

---

### Feature 8: Shared Package (NEW)
**Status**: NEW (core)

**What it is**: Modular architecture with shared packages for contracts, schemas, types, and AI logic.

**User Story**:
> As a developer, I want well-typed shared packages that define contracts between frontend, backend, and desktop, so I can work on different parts of the codebase without stepping on each other.

**Functional Requirements**:
- Define shared TypeScript types and interfaces
- Establish contracts between frontend, backend, and desktop
- Provide AI-agnostic logic for prompt templates, parsers, providers
- Enable testing of AI logic without frontend/backend dependencies

**Technical Implementation**:
- `packages/shared` — Shared types, interfaces, contracts
  - `types.ts` — DesignIteration, GenerationGroup, Comment, Project, Settings
  - `contracts.ts` — API request/response shapes, error types
  - `schemas.ts` — Zod/Drizzle schemas for validation
- `packages/core` — AI-agnostic logic
  - `prompts/` — Prompt templates for layout, review, critique
  - `parsers/` — HTML parsing, size extraction, cleanup
  - `providers/` — LLM SDK wrappers with retry/error handling
  - `pipeline/` — Pipeline orchestration logic
- Frontend, backend, and desktop import from shared packages

**Architecture**:
- Bun workspace monorepo (simpler than Turborepo for v2)
- TypeScript strict mode with no type errors across packages
- ESLint configured per package with shared rules

---

## 4. Post-MVP Features (P1)

Features for subsequent releases after the MVP is stable.

### P1-1: Multi-User Collaboration
- Real-time collaboration with WebSocket
- Cursor tracking for multiple users
- Conflict resolution for concurrent edits

### P1-2: Component Library Management
- Save and reuse generated components
- Component library with versioning
- Drag-and-drop component palette

### P1-3: Design System Enforcement
- Shared color palettes, typography scales, design tokens
- Auto-apply tokens to generated designs
- Token export (Tailwind config, CSS variables)

### P1-4: Enhanced Canvas
- React Flow canvas (upgrade path from CSS transforms)
- Minimap navigation
- Nested frames and containers

### P1-5: Advanced Export Formats
- Figma plugin export
- Vanilla CSS export
- Vue SFC export
- Sketch import/export

### P1-6: Cloud Sync
- Optional cloud storage for projects
- Team workspaces
- Collaboration permissions

### P1-7: Mobile Optimization
- Touch gestures for canvas
- Responsive design for smaller screens
- Progressive Web App (PWA) support

### P1-8: Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard-only navigation

---

## 5. Technical Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Runtime** | Bun | latest | Fast, minimal, great TypeScript support |
| **Monorepo** | Bun Workspaces | latest | Simpler than Turborepo for v2, incremental adoption |
| **Frontend** | Next.js | 16.x | App Router, great DX, already working |
| **UI** | React | 19.x | Latest, improved hooks, automatic batching |
| **Styling** | Tailwind CSS | 4.x | Latest, improved JIT, CSS variables |
| **Language** | TypeScript | 5.x | Type safety, better DX |
| **Canvas** | CSS Transforms + @use-gesture/react | latest | Proven, performant, lightweight |
| **State** | Zustand | latest | Simple, scalable, TypeScript-first |
| **Database** | SQLite + Drizzle ORM | latest | Server-side persistence, type-safe queries |
| **AI - Layout & QA** | Anthropic SDK (Claude) | 0.74.x | Proven quality, streaming support |
| **AI - Images** | Google GenAI SDK (Gemini) | 1.41.x | Free tier, good image generation |
| **Desktop** | Electrobun | latest | Modern, fast, Bun-native |
| **HTML-to-Image** | html-to-image / html2canvas-pro | latest | Reliable format conversion |
| **Linting** | ESLint | latest | Strict TypeScript + React rules |
| **Testing** | Vitest | latest | Fast, Jest-compatible |

---

## 6. Architecture

### 6.1 Monorepo Structure

```
calca/
├── apps/
│   ├── web/           → Next.js frontend (SPA-like)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          → Canvas page
│   │   │   │   └── api/
│   │   │   │       ├── plan/
│   │   │   │       ├── pipeline/
│   │   │   │       ├── export/
│   │   │   │       ├── projects/
│   │   │   │       └── settings/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── desktop/       → Electrobun desktop wrapper
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── windows/
│   │   │   └── ipc/
│   │   ├── package.json
│   │   └── electron-builder.json
│   │
│   └── server/        → API server (optional, for future)
│       ├── src/
│       │   ├── routes/
│       │   ├── lib/
│       │   └── db/
│       └── package.json
│
├── packages/
│   ├── shared/        → Shared types, contracts, schemas
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── contracts.ts
│   │   │   └── schemas.ts
│   │   └── package.json
│   │
│   ├── core/          → AI-agnostic logic
│   │   ├── src/
│   │   │   ├── prompts/
│   │   │   ├── parsers/
│   │   │   ├── providers/
│   │   │   ├── pipeline/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── db/            → Database schema and migrations
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── queries.ts
│   │   └── package.json
│   │
│   └── ui/            → Reusable UI components (optional, v3+)
│       ├── src/
│       │   ├── components/
│       │   └── hooks/
│       └── package.json
│
├── platforms/
│   └── desktop/       → Desktop-specific logic (Electrobun)
│       ├── src/
│       │   ├── windows/
│       │   ├── ipc/
│       │   └── main.tsx
│       └── package.json
│
├── docs/
│   ├── decisions/     → MADRs (0001-0009+)
│   ├── architecture-plan.md
│   ├── prd-v2.md       → This file
│   ├── prd-original.md
│   └── prd-poc.md
│
├── .opencode/
│   └── skills/        → OpenSpec skills
│
├── .sisyphus/
│   ├── notepads/      → Sisyphus learnings
│   └── plans/         → Sisyphus implementation plans
│
├── bun.lockb
├── package.json
├── tsconfig.base.json
└── turbo.json
```

### 6.2 File Contracts

**`packages/shared/src/types.ts`**:
```typescript
// Core types shared across frontend, backend, desktop
export interface DesignIteration {
  id: string;
  html: string;
  label?: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  prompt: string;
  comments: Comment[];
  createdAt: Date;
}

export interface GenerationGroup {
  id: string;
  prompt: string;
  iterations: DesignIteration[];
  position: { x: number; y: number };
  createdAt: Date;
}

export interface Comment {
  id: string;
  designId: string;
  position: { x: number; y: number };
  text: string;
  number: number;
  status: 'waiting' | 'working' | 'done';
  thread?: CommentThread;
  createdAt: Date;
}

export interface CommentThread {
  messages: CommentMessage[];
  createdAt: Date;
}

export interface CommentMessage {
  id: string;
  text: string;
  role: 'user' | 'ai';
  createdAt: Date;
}

export interface CanvasState {
  groups: GenerationGroup[];
  viewport: { x: number; y: number; scale: number };
  selectedIds: string[];
  comments: Comment[];
}

export interface Settings {
  apiKeyAnthropic: string | null;
  apiKeyGemini: string | null;
  apiKeyUnsplash: string | null;
  apiKeyOpenAI: string | null;
  model: 'opus-4-20250514' | 'sonnet-4-20250514' | 'opus-4-20250514-20240920' | 'sonnet-4-20250514-20240920';
  systemPromptPreset: 'ui-ux' | 'marketing' | 'brand';
  conceptCount: number;
  quickMode: boolean;
  showZoomControls: boolean;
}

export interface Project {
  id: string;
  name: string;
  canvasState: CanvasState;
  createdAt: Date;
  updatedAt: Date;
}
```

**`packages/shared/src/contracts.ts`**:
```typescript
// API request/response shapes
export interface PlanRequest {
  prompt: string;
  conceptCount: number;
  quickMode: boolean;
}

export interface PlanResponse {
  concepts: {
    id: string;
    description: string;
    visualStyle: string;
  }[];
}

export interface PipelineLayoutRequest {
  prompt: string;
  conceptId: string;
  sizeHints?: Record<string, { width: number; height: number }>;
}

export interface PipelineLayoutResponse {
  html: string;
  sizeHints: Record<string, { width: number; height: number }>;
}

export interface PipelineImagesRequest {
  images: Array<{ id: string; url: string; preferredSource?: string }>;
}

export interface PipelineImagesResponse {
  images: Array<{ id: string; url: string }>;
}

export interface PipelineReviewRequest {
  html: string;
  images?: Record<string, string>;
}

export interface PipelineReviewResponse {
  html: string;
  fixes: Array<{ location: string; message: string }>;
}

export interface PipelineCritiqueRequest {
  previousHTML: string;
  previousFeedback: string;
}

export interface PipelineCritiqueResponse {
  feedback: string;
  suggestions: string[];
}

export interface ExportRequest {
  html: string;
  format: 'svg' | 'png' | 'jpg' | 'tailwind' | 'react';
}

export interface ExportResponse {
  content: string;
  mimeType?: string;
}

export type ApiError = AuthError | RateLimitError | TimeoutError | ValidationError;

export interface AuthError extends Error {
  type: 'auth';
  message: string;
}

export interface RateLimitError extends Error {
  type: 'rate_limit';
  message: string;
  retryAfter?: number;
}

export interface TimeoutError extends Error {
  type: 'timeout';
  message: string;
  retryAfter?: number;
}

export interface ValidationError extends Error {
  type: 'validation';
  message: string;
  field?: string;
}
```

**`packages/core/src/pipeline/layout.ts`**:
```typescript
// AI-agnostic layout generation logic
import type { PipelineLayoutRequest, PipelineLayoutResponse } from '../../shared/contracts.ts';
import type { LLMProvider } from '../providers/llm-provider.ts';

export interface LayoutPipelineConfig {
  provider: LLMProvider;
  systemPrompt: string;
}

export class LayoutPipeline {
  constructor(private config: LayoutPipelineConfig) {}

  async generate(request: PipelineLayoutRequest): Promise<PipelineLayoutResponse> {
    // Prompt construction
    const prompt = this.buildPrompt(request);

    // Streaming response
    const response = await this.config.provider.stream(prompt);

    // HTML parsing and size extraction
    const { html, sizeHints } = this.parseResponse(response);

    return { html, sizeHints };
  }

  private buildPrompt(request: PipelineLayoutRequest): string {
    // Prompt template with concept-specific instructions
    return `Create a design for: ${request.prompt}

Concept ID: ${request.conceptId}

${request.sizeHints ? `Size hints: ${JSON.stringify(request.sizeHints)}` : ''}

Generate HTML/CSS with inline styles. Use placeholder divs for images: <!--image: id:preferred-source-->`;
  }

  private parseResponse(response: string): { html: string; sizeHints: Record<string, { width: number; height: number }> } {
    // Extract HTML and size hints from AI response
    // This is implementation-specific (e.g., regex or parser)
    const htmlMatch = response.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    const html = htmlMatch ? htmlMatch[1] : response;

    const sizeHints: Record<string, { width: number; height: number }> = {};

    // Extract size hints like: <!--size: button:200x50-->
    const sizeMatch = html.match(/<!--size:(.+?)-->/g);
    if (sizeMatch) {
      sizeMatch.forEach((match) => {
        const matchWithoutTag = match.replace(/<!--size:|-->?/g, '');
        const [id, size] = matchWithoutTag.split(':');
        const [width, height] = size.split('x').map(Number);
        sizeHints[id] = { width, height };
      });
    }

    return { html, sizeHints };
  }
}
```

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- Canvas pan/zoom must feel smooth (CSS transforms with `will-change: transform`)
- Streaming layout generation with keepalive pings (every 5s) to avoid Vercel function timeouts
- Debounced state persistence (500ms)
- Image compression for storage (max 1024px for API, 800px for database, 128px thumbnails)
- Database queries < 100ms for project lists, < 500ms for project loading

### NFR-2: Scalability
- Client-side architecture for frontend (Next.js SPA)
- API routes are stateless proxies to AI providers
- Max function duration: 300s for pipeline routes, 30s for plan/critique
- SQLite supports millions of designs (no limit for MVP)
- Monorepo build time < 30s for full project

### NFR-3: Security
- API keys stored server-side in database (encrypted at rest)
- HTTPS only (server-side API keys)
- HTML rendered in sandboxed iframes (origin isolation)
- Input validation for all API endpoints
- Rate limiting for AI provider calls

### NFR-4: Usability
- Zero-config start (no account, no database required for web)
- Guided onboarding for new users
- Prompt library for quick starts
- Keyboard shortcuts for power users
- Pipeline status overlay showing generation progress per frame
- Error messages with actionable guidance

### NFR-5: Compatibility
- Modern browsers only (ES modules, CSS transforms, IndexedDB, Clipboard API)
- No mobile-optimized UI (desktop-first)
- Self-contained HTML/CSS output (system font stack, no external dependencies for generated designs)
- Desktop app requires macOS 13+, Windows 10+, or Linux with Electron support

---

## 8. Out of Scope

The following are explicitly **not** part of Calca v2 MVP:

- **User accounts or authentication** — No login, no user profiles, no team management
- **Real-time collaboration** — Single-user tool, no multi-user editing (P1-1)
- **Version history** — No undo/redo beyond browser session (P1-4 will add nested frames)
- **Component library management** — No saving/reusing generated components (P1-2)
- **Design system enforcement** — No shared color palettes, typography scales, or tokens beyond per-prompt instructions (P1-3)
- **Mobile support** — Desktop-only experience (P1-7)
- **Accessibility compliance** — No WCAG audit or screen reader support (P1-8)
- **Internationalization** — English-only UI
- **Automated testing** — No unit tests, integration tests, or E2E tests for MVP (add later for stability)
- **CI/CD pipeline** — Manual deployment
- **Analytics** — Optional Google Analytics via env var, no product analytics
- **Real-time collaboration** — Single-user tool (P1-1)

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
1. Set up Bun workspace monorepo structure
2. Create shared packages (types, contracts, schemas)
3. Extract AI logic to `packages/core` (prompts, parsers, providers)
4. Initialize SQLite + Drizzle ORM with schema
5. Write basic API routes using shared packages

### Phase 2: Frontend Refactor (Week 2)
1. Refactor canvas state to Zustand stores
2. Extract components from `page.tsx` to separate files
3. Implement settings UI with server-side API integration
4. Add desktop shell (Electrobun) wrapper
5. Test canvas performance with 50+ frames

### Phase 3: Backend Integration (Week 3)
1. Implement database queries and migrations
2. Add error handling and retry logic to API routes
3. Implement project CRUD operations
4. Add export functionality
5. Test end-to-end generation flow

### Phase 4: Desktop Shell (Week 4)
1. Implement window chrome and native menus
2. Add desktop-specific hotkeys
3. Implement system tray integration
4. Test auto-update check
5. Optimize startup time and memory footprint

### Phase 5: Testing & Polish (Week 5)
1. Manual testing of all MVP features
2. Performance optimization (virtualization, caching)
3. Error handling improvements
4. Documentation updates
5. Prepare for initial release

---

## 10. Success Criteria

The MVP is successful when:

1. **All 8 MVP features are functional**:
   - Canvas pan/zoom with 60fps performance
   - AI generation with multi-model pipeline (Claude layout + Gemini images + Claude QA)
   - Projects CRUD with SQLite persistence
   - Export in 5 formats (SVG, PNG, JPG, Tailwind, React)
   - Settings with BYOK API keys and model selection
   - Desktop shell with native menus and hotkeys
   - Shared packages enable modularity and testing

2. **Performance targets met**:
   - Canvas zoom < 16ms latency
   - Project list load < 100ms
   - Project load < 500ms
   - Desktop startup < 2 seconds

3. **Quality standards met**:
   - No TypeScript errors across all packages
   - ESLint pass with strict rules
   - Error messages actionable and clear
   - No memory leaks (Canvas, Zustand stores)

4. **User workflow completed**:
   - New user can generate a design from prompt
   - User can save project and load it later
   - User can add comments and request revisions
   - User can export design in desired format
   - Desktop user can use all features with native experience

---

## 11. References

- **Original PRD**: `docs/prd-original.md` — Otto Canvas feature set (v1)
- **POC PRD**: `docs/prd-poc.md` — Monorepo migration attempt (v1.5)
- **POC Learnings**: `docs/poc-learnings.md` — Carry/Skip/Redesign verdicts
- **Architecture Plan**: `docs/architecture-plan.md` (to be created) — Detailed architecture decisions
- **OpenSpec**: `.opencode/skills/` — Change management workflow
- **MADRs**: `docs/decisions/0001-0009.md` — Technology decision documents

---

*Document Version*: 1.0
*Last Updated*: 2026-04-05
*Author*: Sisyphus Project Management
