# AGENTS.md — Gosto Development Guidelines

**Level 1: Project Overview**
**Level 2: File Contracts & Rules**
**Level 3: VSA Anatomy & AI Patterns**

---

## Level 1: Project Overview

### Project Identity

**Gosto v2** is a desktop-first AI design tool that transforms natural language prompts into polished HTML/CSS design variations on an infinite canvas. Unlike v1, v2 introduces server-side persistence, shared packages, and centralized state management.

**Core Value Proposition**:
- Users describe designs in plain English
- AI generates multiple polished HTML/CSS variations
- Each variation learns from critiques, improving over time
- Users can comment, request revisions, and export to various formats

**Desktop-First Design**:
- Optimized for keyboard shortcuts and mouse control
- Infinite canvas with Figma-style pan/zoom
- System tray and native menus in desktop shell
- No mobile optimization (P1 feature)

---

### Monorepo Structure

```
gosto/
├── apps/
│   ├── web/          → Next.js frontend (SPA-like)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          → Canvas page
│   │   │   │   └── api/
│   │   │   │       ├── plan/
│   │   │   │       ├── pipeline/
│   │   │   │       ├── export/
│   │   │   │       └── projects/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/               → Zustand state stores
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── desktop/      → Electrobun wrapper (post-MVP)
│   │   └── src/
│   │       ├── windows/
│   │       └── ipc/
│   │
│   └── server/       → Optional API server (future)
│
├── packages/
│   ├── shared/       → Shared types, contracts, schemas
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── contracts.ts
│   │   │   └── schemas.ts
│   │   └── package.json
│   │
│   ├── core/         → AI-agnostic logic (extracted v2)
│   │   ├── src/
│   │   │   ├── prompts/               → Prompt templates
│   │   │   ├── parsers/              → HTML parsing
│   │   │   ├── providers/            → SDK wrappers
│   │   │   ├── pipeline/             → Pipeline orchestration
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── db/           → Database schema & queries (Drizzle)
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── queries.ts
│   │   └── package.json
│   │
│   └── ui/           → Reusable UI components (v3+)
│
├── docs/
│   ├── decisions/    → MADRs (0001-0009+)
│   ├── prd-v2.md     → Product requirements
│   └── poc-learnings.md → Architecture decisions
│
├── .sisyphus/
│   ├── notepads/     → Sisyphus learnings
│   └── plans/        → Sisyphus plans
│
└── package.json      → Root dependencies
```

---

### Tech Stack Summary

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Runtime** | Bun | latest | Fast, minimal, great TypeScript support |
| **Monorepo** | Bun Workspaces | latest | Simpler than Turborepo for v2 |
| **Frontend** | Next.js | 16.x | App Router, SPA-like experience |
| **UI** | React | 19.x | Latest, improved hooks |
| **Styling** | Tailwind CSS | 4.x | Latest, CSS variables, JIT |
| **Language** | TypeScript | 5.x | Strict mode, full type safety |
| **Canvas** | CSS Transforms + @use-gesture/react | latest | Proven, performant, Figma-style |
| **State** | Zustand | latest | Centralized stores, replaces 20+ useState |
| **Database** | SQLite + Drizzle ORM | latest | Server-side persistence |
| **AI - Layout/QA** | Anthropic SDK (Claude) | 0.74.x | Streaming, proven quality |
| **AI - Images** | Google GenAI SDK (Gemini) | 1.41.x | Free tier, good image generation |
| **Desktop** | Electrobun | latest | Bun-native (post-MVP) |
| **Testing** | Vitest | latest | Jest-compatible, fast |

---

### Quick Start Commands

```bash
# Install dependencies
bun install

# Run development server (Next.js web app)
bun run dev

# Build all packages
bun run build

# Run production build
bun run build && bun run start

# Run linter
bun run lint

# Run tests
bun test

# Type check
bun run type-check
```

**Development Workflow**:
1. Make changes in `apps/web/src`
2. Shared types in `packages/shared/src`
3. AI logic in `packages/core/src`
4. Database queries in `packages/db/src`
5. Run `bun run dev` to preview changes
6. Test canvas performance with 50+ frames
7. Verify TypeScript compilation passes

---

### Key Features (MVP)

1. **Canvas** — Infinite canvas with pan/zoom, rubber band selection, zoom-to-fit
2. **AI Generation Pipeline** — 4-stage pipeline (plan → layout → images → review → critique)
3. **Projects Management** — CRUD with SQLite persistence, auto-save every 2 minutes
4. **Pipeline** — Multi-model image generation with fallback chain
5. **Export** — SVG, PNG, JPG, Tailwind CSS, React components
6. **Settings** — BYOK API keys, model selection, design presets
7. **Desktop Shell** — Native menus, hotkeys, system tray (post-MVP)
8. **Shared Packages** — Modular architecture, contracts, AI-agnostic logic

---

## Level 2: File Contracts & Rules

### Shared Package Contracts

**`packages/shared/src/types.ts`**:
```typescript
// Core types shared across all apps
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

export interface Settings {
  apiKeyAnthropic: string | null;
  apiKeyGemini: string | null;
  apiKeyUnsplash: string | null;
  apiKeyOpenAI: string | null;
  model: string;
  systemPromptPreset: 'ui-ux' | 'marketing' | 'brand';
  conceptCount: number;
  quickMode: boolean;
  showZoomControls: boolean;
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

export type ApiError =
  | { type: 'auth'; message: string }
  | { type: 'rate_limit'; message: string; retryAfter?: number }
  | { type: 'timeout'; message: string; retryAfter?: number }
  | { type: 'validation'; message: string; field?: string };
```

---

### Cross-Package Import Rules

**Imports should always flow inward:**

```
apps/web/          → imports from packages/shared, packages/core
apps/desktop/      → imports from packages/shared
packages/db/       → used by apps/web, apps/desktop
packages/shared/   → no internal imports (base layer)
packages/core/     → imports from packages/shared, packages/db (if needed)
packages/ui/       → imports from packages/shared, packages/core (if needed)
```

**Never import circularly:**
- ❌ `packages/core` → `apps/web`
- ❌ `packages/db` → `packages/core`
- ❌ `packages/shared` → `packages/core`

**Package hierarchy for dependencies:**
```
apps/      ← packages/ui, packages/shared
packages/  ← packages/core
```

---

### File Naming Conventions

**Components**: `PascalCase.tsx` or `PascalCase/index.tsx`
- `DesignFrame.tsx` → individual component
- `Canvas/index.tsx` → barrel export

**Hooks**: `useCamelCase.ts`
- `useCanvas.ts`
- `useDesignStore.ts`

**API Routes**: `route.ts` (Next.js convention)
- `apps/web/src/app/api/pipeline/layout/route.ts`
- `apps/web/src/app/api/projects/route.ts`

**Store Files**: `store.ts` or `index.ts`
- `apps/web/src/stores/canvas.ts`
- `apps/web/src/stores/design.ts`

**Utility Files**: `camelCase.ts` or `index.ts`
- `utils/format.ts`
- `utils/index.ts`

---

### TypeScript Strict Mode

**Enable strict mode globally**:
```json
// apps/web/tsconfig.json, packages/*/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type checking across packages**:
```bash
bun run type-check
```

---

### ESLint Rules

**Shared rules in `.eslintrc.cjs`**:
```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

---

### Testing Guidelines

**Test new AI logic first**:
```typescript
// packages/core/src/pipeline/layout.test.ts
import { describe, it, expect } from 'vitest';
import { LayoutPipeline } from './layout.ts';

describe('LayoutPipeline', () => {
  it('generates HTML from prompt', async () => {
    const pipeline = new LayoutPipeline({ provider: mockProvider });
    const result = await pipeline.generate({
      prompt: 'A pricing card',
      conceptId: '1',
    });
    expect(result.html).toContain('<div');
  });
});
```

**Test canvas stores**:
```typescript
// apps/web/src/stores/canvas.test.ts
import { describe, it, expect } from 'vitest';
import { useCanvasStore } from './canvas.ts';

describe('useCanvasStore', () => {
  it('zooms to fit after generation', () => {
    const { zoomTo } = useCanvasStore.getState();
    zoomTo(1);
    expect(useCanvasStore.getState().scale).toBe(1);
  });
});
```

**Run tests**:
```bash
bun test
```

---

### State Management (Zustand)

**Replace 20+ useState hooks with centralized stores:**

```typescript
// apps/web/src/stores/canvas.ts
import { create } from 'zustand';

interface CanvasState {
  viewport: { x: number; y: number; scale: number };
  selectedIds: string[];
  zoomTo: (scale: number) => void;
  setViewport: (viewport: CanvasState['viewport']) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  viewport: { x: 0, y: 0, scale: 1 },
  selectedIds: [],
  zoomTo: (scale) => set((state) => ({ viewport: { ...state.viewport, scale } })),
  setViewport: (viewport) => set({ viewport }),
}));
```

**Use stores in components:**
```typescript
// Don't
const [scale, setScale] = useState(1);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Do
const { scale, zoomTo } = useCanvasStore();
const { selectedIds, setSelectedIds } = useSelectionStore();
```

---

### API Route Patterns

**Thin route handlers using shared packages:**
```typescript
// apps/web/src/app/api/pipeline/layout/route.ts
import { LayoutPipeline } from '@gosto/core/pipeline/layout';
import type { PipelineLayoutRequest, PipelineLayoutResponse } from '@gosto/shared/contracts';

export async function POST(request: Request) {
  const body: PipelineLayoutRequest = await request.json();

  const pipeline = new LayoutPipeline({
    provider: createClaudeProvider(),
    systemPrompt: getSystemPrompt('ui-ux'),
  });

  try {
    const result = await pipeline.generate(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'layout_failed', message: error.message },
      { status: 500 }
    );
  }
}
```

**Streaming responses for long-running operations:**
```typescript
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = await pipeline.streamLayout(prompt);
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

### Error Handling Patterns

**Structured error types in shared contracts:**
```typescript
export type ApiError =
  | { type: 'auth'; message: string }
  | { type: 'rate_limit'; message: string; retryAfter?: number }
  | { type: 'timeout'; message: string; retryAfter?: number }
  | { type: 'validation'; message: string; field?: string };
```

**Retry logic for transient errors:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-transient errors
      if (isPermanentError(error)) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

function isPermanentError(error: unknown): boolean {
  const err = error as any;
  return err.type === 'auth' || err.type === 'validation';
}
```

---

## Level 3: VSA Anatomy & AI Patterns

### VSA (Vibe, Style, Aesthetic) Anatomy

**Each AI design concept has three components**:

1. **Vibe** — Overall mood, tone, emotional quality
   - Example: "warm and inviting", "bold and minimal", "playful and energetic"
   - Determined during `/api/plan` phase
   - Guides image generation style

2. **Style** — Design language, technical approach
   - Example: "glassmorphism", "neumorphism", "flat design"
   - Guides layout and typography choices
   - Influences color palette selection

3. **Aesthetic** — Visual refinement, polish level
   - Example: "elegant", "gritty", "sophisticated"
   - Guides detail level in generated HTML/CSS
   - Affects spacing, shadows, micro-interactions

---

### Mastra Patterns (Migrated to Shared Packages)

**Prompt Construction Patterns**:

```typescript
// packages/core/src/prompts/layout.ts

export function buildLayoutPrompt(
  prompt: string,
  conceptId: string,
  sizeHints: Record<string, { width: number; height: number }>,
  vibe: string,
  style: string,
  aesthetic: string
): string {
  return `Create a ${aesthetic} design for: ${prompt}

Concept: ${conceptId}
Vibe: ${vibe}
Style: ${style}

${sizeHints ? `Size hints: ${JSON.stringify(sizeHints)}` : ''}

Generate HTML/CSS with inline styles. Use placeholder divs for images: <!--image: id:preferred-source-->
`;
}
```

**HTML Parsing Patterns**:

```typescript
// packages/core/src/parsers/layout.ts

export function extractSizeHints(html: string): Record<string, { width: number; height: number }> {
  const sizeHints: Record<string, { width: number; height: number }> = {};

  const regex = /<!--size:(.+?)-->/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [full, rest] = match;
    const parts = rest.split(':');
    const [id, size] = parts;
    const [width, height] = size.split('x').map(Number);

    sizeHints[id] = { width, height };
  }

  return sizeHints;
}
```

**Provider Wrapper Patterns**:

```typescript
// packages/core/src/providers/llm-provider.ts

export interface LLMProvider {
  stream(prompt: string): AsyncGenerator<string>;
  complete(prompt: string): Promise<string>;
}

export class ClaudeProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  async *stream(prompt: string): AsyncGenerator<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          const data = JSON.parse(jsonStr);
          const text = data.delta?.content?.[0]?.text;
          if (text) yield text;
        }
      }
    }
  }

  async complete(prompt: string): Promise<string> {
    const fullResponse: string[] = [];
    for await (const chunk of this.stream(prompt)) {
      fullResponse.push(chunk);
    }
    return fullResponse.join('');
  }
}
```

---

### Pipeline Stages

**Four-stage AI pipeline:**

1. **Plan (`/api/plan`)** — Determine concept count and visual directions
   - Input: User prompt
   - Output: Array of concept descriptions (2-6)

2. **Layout (`/api/pipeline/layout`)** — Generate HTML/CSS with sizing hints
   - Input: Prompt, concept ID, size hints
   - Output: HTML string with inline styles, size hints

3. **Images (`/api/pipeline/images`)** — Fill placeholders with real images
   - Input: HTML with placeholder IDs, preferred sources
   - Output: HTML with image URLs

4. **Review (`/api/pipeline/review`)** — Visual QA and auto-fixes
   - Input: Rendered HTML, images
   - Output: HTML with fixes applied

5. **Critique (`/api/pipeline/critique`)** — Generate improvement feedback
   - Input: Previous HTML, previous feedback
   - Output: Improvement suggestions for next iteration

**Sequential vs Parallel Modes**:
- **Sequential**: Critique from Frame N-1 feeds into Frame N
- **Parallel**: All concepts generated independently (faster, less coherent)

---

### Feature Registration Pattern

**ServerFeature and UIFeature classes define feature contracts:**

```typescript
// packages/core/src/features/server-feature.ts

export abstract class ServerFeature {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  // Called when feature is loaded
  async onActivate(): Promise<void> {}

  // Called when feature is deactivated
  async onDeactivate(): Promise<void> {}
}

// packages/core/src/features/ui-feature.ts

export abstract class UIFeature {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  // Called when feature is registered
  async onRegister(): Promise<void> {}

  // Called when feature is unregistered
  async onUnregister(): Promise<void> {}
}
```

**Example feature registration**:

```typescript
// apps/web/src/lib/features/canvas-feature.ts
import { ServerFeature } from '@gosto/core/features/server-feature';
import { useCanvasStore } from '@/stores/canvas.ts';

export class CanvasFeature extends ServerFeature {
  readonly id = 'canvas';
  readonly name = 'Infinite Canvas';
  readonly description = 'Pan, zoom, and scroll with Figma-style controls';

  async onActivate(): Promise<void> {
    // Initialize canvas state
    useCanvasStore.setState({
      viewport: { x: 0, y: 0, scale: 1 },
      selectedIds: [],
    });
  }
}

// apps/web/src/lib/features/canvas-registry.ts
import { CanvasFeature } from './canvas-feature.ts';

const featureRegistry: Map<string, any> = new Map();

export function registerFeature(feature: any): void {
  featureRegistry.set(feature.id, feature);
  feature.onRegister?.();
}

export function getFeature(id: string): any {
  return featureRegistry.get(id);
}
```

---

### AI Provider Wrappers

**Multi-provider pattern with fallback chain**:

```typescript
// packages/core/src/providers/image-provider.ts

export interface ImageProvider {
  generate(
    prompt: string,
    size: { width: number; height: number },
    preferredSource?: string
  ): Promise<string>;
}

export class UnsplashProvider implements ImageProvider {
  async generate(prompt: string, size: { width: number; height: number }, preferredSource?: string): Promise<string> {
    const unsplashUrl = `https://source.unsplash.com/${size.width}x${size.height}/?${encodeURIComponent(prompt)}`;
    return unsplashUrl;
  }
}

export class DallEProvider implements ImageProvider {
  async generate(prompt: string, size: { width: number; height: number }): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size: `${size.width}x${size.height}`,
        n: 1,
      }),
    });

    const data = await response.json();
    return data.data[0].url;
  }
}

export class GeminiProvider implements ImageProvider {
  async generate(prompt: string, size: { width: number; height: number }): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateImages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: `${size.width}:${size.height}`,
      }),
    });

    const data = await response.json();
    return data.imageUrls[0];
  }
}

// Fallback chain with health checking
export class MultiImageProvider implements ImageProvider {
  private providers: ImageProvider[] = [
    new UnsplashProvider(),
    new DallEProvider(),
    new GeminiProvider(),
  ];

  async generate(
    prompt: string,
    size: { width: number; height: number },
    preferredSource?: string
  ): Promise<string> {
    const providerIndex = preferredSource ? this.providers.findIndex(p => p.constructor.name.toLowerCase().includes(preferredSource.toLowerCase())) : 0;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[(providerIndex + i) % this.providers.length];
      try {
        return await provider.generate(prompt, size, preferredSource);
      } catch (error) {
        console.warn(`Provider ${provider.constructor.name} failed, trying next...`);
        continue;
      }
    }

    throw new Error('All image providers failed');
  }
}
```

---

### Design Presets System

**Three built-in presets with detailed system prompts**:

```typescript
// packages/core/src/prompts/presets.ts

export type Preset = 'ui-ux' | 'marketing' | 'brand';

export interface PresetConfig {
  id: Preset;
  name: string;
  description: string;
  typography: {
    scale: string[];
    headings: { weights: string[]; sizes: string[] };
  };
  spacing: {
    unit: number;
    multipliers: number[];
  };
  colors: {
    palette: string[];
    semantic: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  antiPatterns: string[];
  systemPrompt: string;
}

export const PRESETS: Record<Preset, PresetConfig> = {
  'ui-ux': {
    id: 'ui-ux',
    name: 'UI/UX Design',
    description: 'Modern interfaces with attention to spacing, hierarchy, and micro-interactions',
    typography: {
      scale: ['12px', '14px', '16px', '20px', '24px', '32px', '48px'],
      headings: { weights: ['400', '500', '600', '700'], sizes: ['20px', '24px', '32px', '48px'] },
    },
    spacing: {
      unit: 4,
      multipliers: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
    },
    colors: {
      palette: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
      semantic: { primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
    },
    antiPatterns: ['beveled edges', 'gradients', 'animations'],
    systemPrompt: `You are a UI/UX designer. Create clean, modern interfaces with proper spacing, typography hierarchy, and micro-interactions. Avoid beveled edges, excessive gradients, and animations.`,
  },
  'marketing': {
    id: 'marketing',
    name: 'Marketing Website',
    description: 'High-conversion landing pages with compelling visuals and clear calls-to-action',
    typography: {
      scale: ['14px', '16px', '20px', '28px', '36px', '48px', '64px'],
      headings: { weights: ['400', '500', '600', '700'], sizes: ['28px', '36px', '48px', '64px'] },
    },
    spacing: {
      unit: 8,
      multipliers: [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    colors: {
      palette: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
      semantic: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b' },
    },
    antiPatterns: ['small text', 'distracting backgrounds', 'cluttered layouts'],
    systemPrompt: `You are a marketing copywriter and designer. Create high-conversion landing pages with compelling visuals, clear calls-to-action, and compelling copy. Avoid small text, distracting backgrounds, and cluttered layouts.`,
  },
  'brand': {
    id: 'brand',
    name: 'Brand/Ad Design',
    description: 'Bold, minimal designs perfect for social ads and brand materials',
    typography: {
      scale: ['14px', '16px', '18px', '24px', '32px', '48px', '64px'],
      headings: { weights: ['400', '500', '600', '700'], sizes: ['24px', '32px', '48px', '64px'] },
    },
    spacing: {
      unit: 8,
      multipliers: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
    },
    colors: {
      palette: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
      semantic: { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#f59e0b' },
    },
    antiPatterns: ['traditional corporate design', 'soft shadows', 'minimal white space'],
    systemPrompt: `You are a brand designer. Create bold, minimal designs perfect for social ads and brand materials. Avoid traditional corporate design, soft shadows, and minimal white space.`,
  },
};
```

---

### Database Schema (Drizzle)

**Core tables**:

```typescript
// packages/db/src/schema.ts
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  canvasState: text('canvas_state').notNull(), // JSON
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const designs = pgTable('designs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  position: text('position').notNull(), // JSON { x, y }
  html: text('html').notNull(),
  width: integer('width'),
  height: integer('height'),
  prompt: text('prompt').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  designId: text('design_id').notNull().references(() => designs.id),
  position: text('position').notNull(), // JSON { x, y }
  text: text('text').notNull(),
  number: integer('number').notNull(),
  status: text('status').notNull(), // waiting, working, done
  thread: text('thread'), // JSON { messages: [] }
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  apiKeyAnthropic: text('api_key_anthropic'),
  apiKeyGemini: text('api_key_gemini'),
  apiKeyUnsplash: text('api_key_unsplash'),
  apiKeyOpenAI: text('api_key_openai'),
  model: text('model').notNull(),
  systemPromptPreset: text('system_prompt_preset').notNull(),
  conceptCount: integer('concept_count').notNull().default(4),
  quickMode: boolean('quick_mode').notNull().default(false),
  showZoomControls: boolean('show_zoom_controls').notNull().default(true),
});
```

---

### Performance Optimization Patterns

**Virtualization for 50+ frames**:

```typescript
// apps/web/src/components/canvas-virtualizer.tsx
import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvas.ts';

export function CanvasVirtualizer({ children }: { children: React.ReactNode }) {
  const { viewport } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleFrames, setVisibleFrames] = useState<string[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate which frames are in viewport
    const containerRect = container.getBoundingClientRect();
    const visibleFrames: string[] = [];

    frames.forEach(frame => {
      const frameRect = getFrameBoundingClientRect(frame.id);
      if (
        frameRect.right >= containerRect.left &&
        frameRect.left <= containerRect.right
      ) {
        visibleFrames.push(frame.id);
      }
    });

    setVisibleFrames(visibleFrames);
  }, [viewport]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {frames
        .filter(frame => visibleFrames.includes(frame.id))
        .map(frame => (
          <DesignFrame key={frame.id} frame={frame} />
        ))
      }
    </div>
  );
}
```

**Debounced state persistence**:

```typescript
// apps/web/src/hooks/use-debounce-persist.ts
import { useEffect, useRef } from 'react';
import { saveProject } from '@/lib/projects.ts';

export function useDebouncePersist(
  data: any,
  delayMs = 500,
  key: string
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveProject(key, data);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delayMs, key]);
}
```

---

### Canvas Interaction Patterns

**CSS transform-based pan/zoom with native wheel events**:

```typescript
// apps/web/src/hooks/use-canvas.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvas.ts';

export function useCanvas() {
  const { viewport, setViewport, zoomTo, setSelectedIds } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startViewportRef = useRef({ x: 0, y: 0, scale: 1 });

  // Pan with drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startViewportRef.current = viewport;
  }, [viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    setViewport({
      x: startViewportRef.current.x + dx,
      y: startViewportRef.current.y + dy,
      scale: startViewportRef.current.scale,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * delta));

    // Zoom toward mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newViewportX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newViewportY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

    zoomTo(newScale, newViewportX, newViewportY);
  }, [viewport.scale, viewport.x, viewport.y]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return {
    containerRef,
    viewport,
  };
}
```

---

### Export Patterns

**AI-powered format conversion**:

```typescript
// apps/web/src/app/api/export/route.ts
import type { ExportRequest, ExportResponse } from '@gosto/shared/contracts';

export async function POST(request: Request) {
  const body: ExportRequest = await request.json();

  let content: string;
  let mimeType: string | undefined;

  switch (body.format) {
    case 'svg': {
      // SVG via foreignObject wrapping
      content = generateSVG(body.html, body.width, body.height);
      mimeType = 'image/svg+xml';
      break;
    }
    case 'png': {
      // PNG via html-to-image
      const blob = await generatePNG(body.html);
      content = await blob.text();
      mimeType = 'image/png';
      break;
    }
    case 'tailwind': {
      // Tailwind CSS via Claude
      content = await convertToTailwind(body.html);
      break;
    }
    case 'react': {
      // React component via Claude
      content = await convertToReact(body.html);
      break;
    }
    default:
      return Response.json(
        { error: 'invalid_format', message: `Unsupported format: ${body.format}` },
        { status: 400 }
      );
  }

  return Response.json({ content, mimeType } as ExportResponse);
}

async function generateSVG(html: string, width: number, height: number): Promise<string> {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
      ${html}
    </div>
  </foreignObject>
</svg>
  `.trim();
}
```

---

### Security Patterns

**API key encryption at rest**:

```typescript
// packages/db/src/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

export function encryptApiKey(plainText: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

export function decryptApiKey(encryptedBase64: string): string {
  const buffer = Buffer.from(encryptedBase64, 'base64');

  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + 16);

  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

function deriveKey(salt: Buffer): Buffer {
  return process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : randomBytes(32); // For development only
}
```

---

## References

- **PRD v2**: `docs/prd-v2.md` — Complete feature requirements and technical stack
- **POC Learnings**: `docs/poc-learnings.md** — Carry/Skip/Redesign verdicts
- **Architecture Plan**: See detailed architecture in PRD v2
- **MADRs**: `docs/decisions/0001-0009.md` — Technology decision documents
- **Sisyphus Plans**: `.sisyphus/plans/` — Implementation planning
- **Sisyphus Notepads**: `.sisyphus/notepads/` — Project learnings and decisions
