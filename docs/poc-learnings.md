# POC Learnings

> Analysis of the monorepo migration POC for Gosto v2. Each technology choice gets a verdict: **CARRY** (use in v2), **SKIP** (don't use), or **REDESIGN** (reconsider approach).

---

## What Worked ✅ (CARRY)

### SQLite + Drizzle ORM → **CARRY**
- **Why it worked**: The concept is sound. Client-side localStorage + IndexedDB is fragile (5-10MB limit, complex base64 extract/restore dance in `use-persisted-groups.ts`)
- **Evidence**: Current persistence layer has 157 lines just for base64 image management. Drizzle schema would replace this with a few typed queries
- **v2 Action**: Implement as server-side persistence layer. Use `bun:sqlite` or `better-sqlite3`. Define schema for designs, iterations, comments, settings

### Multi-Model Pipeline Architecture → **CARRY**
- **Why it worked**: The 4-stage pipeline (plan → layout → images → review → critique) is the core IP. Sequential critique loop where each variation learns from the previous is unique and valuable
- **Evidence**: 8 working API routes, clear data flow between stages, two modes (sequential vs parallel)
- **v2 Action**: Extract pipeline logic into `packages/core` — prompts, parsers, provider wrappers. Keep the same flow, make it testable

### CSS Transform Canvas → **CARRY**
- **Why it worked**: 171-line `useCanvas()` hook provides smooth pan/zoom with native wheel events. Figma-like feel. No dependencies
- **Evidence**: Smooth zoom (clamped delta, transform origin), rubber-band selection, zoom-to-fit animation
- **v2 Action**: Keep CSS transforms. Add Zustand for state management. Add virtualization for 50+ frames. Add minimap component

### Design Preset System → **CARRY**
- **Why it worked**: Three detailed presets (UI/UX, Marketing, Brand/Ad) with typography scales, spacing systems, color palettes, and anti-patterns
- **Evidence**: ~600 lines of prompt engineering in `settings-modal.tsx`. Produces significantly better output than generic prompts
- **v2 Action**: Extract presets into `packages/core` as structured data. Allow custom presets saved to DB

### Comment/Revision Queue → **CARRY**
- **Why it worked**: Non-blocking comment system — users can keep adding comments while revisions process one at a time. Figma-style pins with AI response threads
- **Evidence**: `revisionQueueRef` pattern in `page.tsx`. Status tracking (waiting → working → done). Color-coded pins
- **v2 Action**: Same pattern, but move queue logic to server with WebSocket updates

### Multi-Source Image Generation → **CARRY**
- **Why it worked**: Fallback chain (Unsplash → DALL-E → Gemini) with batch processing (3 at a time). Each placeholder specifies preferred source
- **Evidence**: `pipeline/images/route.ts` handles three vendors with graceful fallback
- **v2 Action**: Same architecture. Add source health checking. Cache generated images in SQLite

### Export Pipeline → **CARRY**
- **Why it worked**: AI-powered format conversion (SVG, Tailwind, React). SVG via foreignObject wrapper, code via Claude conversion
- **Evidence**: Working export in `export/route.ts` with format-specific prompts
- **v2 Action**: Add more formats (Figma plugin, vanilla CSS, Vue SFC). Cache conversions

---

## What Didn't ❌ (SKIP)

### Full Turborepo Monorepo → **SKIP**
- **Why it didn't work**: POC directories contain only `node_modules/` — source code was removed. No `turbo.json` was ever created. The monorepo structure was created but never operational
- **Root cause**: Tried to decompose everything at once instead of extracting incrementally. 1,700-line page component can't be split into 6 packages simultaneously
- **v2 Action**: Use Bun workspace (simpler). Start with `packages/shared` (types only), then `packages/core` (AI logic). Add Turborepo later only if needed

### Hono Server Migration → **SKIP**
- **Why it didn't work**: No functional benefit over Next.js API routes. The current routes already use streaming (ReadableStream), handle timeouts (maxDuration), and manage base64 limits. Rewriting to Hono would be pure churn
- **Root cause**: Framework FOMO. Hono's benefits (multi-runtime, testing) don't apply when we're already deployed on Vercel
- **v2 Action**: Keep Next.js API routes. If desktop needs local server, use a thin Hono/Express adapter that wraps the same route handlers

### TanStack Router Migration → **SKIP**
- **Why it didn't work**: Gosto is effectively a single-page app — one canvas page. No routing needed. TanStack Router adds complexity for file-based routing that Next.js App Router already provides
- **Root cause**: Over-engineering. The app has one route (`/`) and 8 API routes. No navigation structure to benefit from client-side routing
- **v2 Action**: Stay with Next.js App Router. If multi-page app becomes needed, Next.js handles it natively

### Mastra AI Framework → **SKIP**
- **Why it didn't work**: The pipeline is 4 sequential steps with clear data flow. An agent framework adds abstraction without value. Direct SDK calls work fine
- **Root cause**: Mastra abstracts LLM interactions, but the pipeline also does image generation (Unsplash/DALL-E), HTML parsing, base64 management, and streaming — none of which Mastra handles
- **v2 Action**: Extract pipeline logic into plain TypeScript functions in `packages/core`. Define a simple `LLMProvider` interface. No framework dependency

### Electrobun Desktop → **SKIP** (for MVP)
- **Why it didn't work**: `platforms/desktop/` contains only `node_modules/`. Electrobun is very early-stage. Desktop distribution is premature for an AI design tool that needs server-side AI calls
- **Root cause**: Desktop was aspirational — the app needs to prove itself as a web tool first
- **v2 Action**: Defer desktop to post-MVP. Use PWA for offline-like experience. Consider Tauri (more mature than Electrobun) when desktop is prioritized

---

## What Needs Redesign 🔧 (REDESIGN)

### Canvas State Management → **REDESIGN**
- **Current**: All state (groups, positions, selections, drag state, comments, images) lives in `page.tsx` as 20+ `useState` hooks
- **Problem**: 1,700-line component with deeply nested state updates. Can't test canvas logic without rendering the full page
- **v2 Target**: Zustand store for canvas state. Separation of:
  - `useCanvasStore` — pan/zoom, viewport
  - `useDesignStore` — groups, iterations, positions
  - `useSelectionStore` — selected IDs, rubber band
  - `useCommentStore` — comments, threads, queue

### API Route Coupling → **REDESIGN**
- **Current**: Each API route constructs its own prompts, calls SDKs directly, and parses responses inline. ~350 lines in `layout/route.ts` alone
- **Problem**: Prompt changes require editing route handlers. No unit testing of prompt construction. Parsing logic duplicated across routes
- **v2 Target**: Extract to `packages/core`:
  - `prompts/` — All prompt templates as composable functions
  - `parsers/` — HTML parsing, size extraction, cleanup
  - `providers/` — SDK wrappers with retry/error handling
  - Routes become thin: parse input → call core → return output

### Settings Management → **REDESIGN**
- **Current**: `useSettings()` stores everything in localStorage as flat JSON. API keys are sent with every request from client state
- **Problem**: API keys in localStorage are accessible to XSS. No server-side settings. Can't sync across devices
- **v2 Target**: Settings stored in SQLite via server API. API keys encrypted at rest. Client fetches settings on load, sends session token (not API keys) with requests

### Persistence Layer → **REDESIGN**
- **Current**: Dual storage (localStorage for metadata, IndexedDB for base64 images). Complex extract/restore cycle in `use-persisted-groups.ts`
- **Problem**: 5-10MB localStorage limit. IndexedDB can be cleared by browser. Base64 images bloat memory
- **v2 Target**: Single SQLite database. Images stored as files on disk (or object storage). Client fetches designs via API. Optional offline support via Service Worker + IndexedDB cache

### Component Architecture → **REDESIGN**
- **Current**: 11 components but `page.tsx` is 1,700 lines. Most logic is in the page component, not in hooks or components
- **Problem**: Can't reuse components. Hard to test. Props drilling through 5+ levels
- **v2 Target**: Decompose page into feature components:
  - `<Canvas>` — Pan/zoom container
  - `<DesignFrame>` — Individual design with iframe rendering
  - `<PromptBar>` — Input + generation trigger
  - `<CommentLayer>` — Comment pins + threads
  - `<Toolbar>` — Tools + settings
  - `<PipelineStatus>` — Progress overlay

### Error Handling → **REDESIGN**
- **Current**: Each route has try/catch returning `{ error: message }`. Client checks `data.error` in pipeline calls
- **Problem**: No error categorization (auth vs rate limit vs timeout). No retry logic. No user-facing error messages
- **v2 Target**: Structured error types (AuthError, RateLimitError, TimeoutError). Automatic retry for transient errors. Toast notifications for user-facing errors

---

## Summary Table

| Technology | Verdict | Reason |
|-----------|---------|--------|
| Turborepo monorepo | SKIP | Never operational, premature decomposition |
| Bun workspace monorepo | CARRY | Simpler alternative, use for v2 |
| Hono server | SKIP | No benefit over Next.js API routes |
| Next.js App Router | CARRY | Works well for SPA + API routes |
| TanStack Router | SKIP | Over-engineering for single-page app |
| React Flow canvas | SKIP | Wrong abstraction (graph vs canvas) |
| CSS transform canvas | CARRY | Proven, performant, needs Zustand |
| SQLite + Drizzle | CARRY | Right persistence for desktop/server |
| Mastra AI framework | SKIP | Over-abstraction for sequential pipeline |
| Direct SDK calls | CARRY | Works, extract to shared package |
| Electrobun desktop | SKIP | Too early, defer to post-MVP |
| Zustand state management | CARRY | Replace 20+ useState hooks |
| Multi-model pipeline | CARRY | Core IP, extract to packages/core |
| Design presets | CARRY | Core IP, extract to packages/core |
| Comment/revision queue | CARRY | Proven pattern, move to server |
| Export pipeline | CARRY | Working, add more formats |
