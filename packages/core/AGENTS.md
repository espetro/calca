# packages/core/AGENTS.md — AI Pipeline & Core Logic

> AI-agnostic logic, pipeline stages, and provider wrappers. See root [AGENTS.md](../../AGENTS.md) for universal rules.

---

## Package Purpose

The `core` package contains **AI-agnostic business logic** that can be used by any app:

- Pipeline stage implementations
- LLM provider wrappers
- Prompt templates
- HTML parsers
- Feature registration system

**Key rule**: Only imports from `packages/shared` (base layer).

---

## File Structure

```
packages/core/
├── src/
│   ├── pipeline/              # Pipeline stages
│   │   ├── plan.ts
│   │   ├── layout.ts
│   │   ├── images.ts
│   │   ├── review.ts
│   │   └── critique.ts
│   ├── providers/             # LLM provider wrappers
│   │   ├── llm-provider.ts
│   │   ├── claude-provider.ts
│   │   └── image-provider.ts
│   ├── prompts/               # Prompt templates
│   │   ├── layout.ts
│   │   ├── plan.ts
│   │   └── presets.ts
│   ├── parsers/               # HTML parsing utilities
│   │   └── layout.ts
│   ├── features/              # Feature registration
│   │   ├── server-feature.ts
│   │   └── ui-feature.ts
│   └── index.ts              # Barrel export
└── package.json
```

---

## Pipeline Stages

### 1. Plan Stage

Determine concept count and visual directions:

```typescript
// pipeline/plan.ts
import type { PlanRequest, PlanResponse } from "@calca/shared/contracts";
import type { PipelineLayoutRequest, PipelineLayoutResponse } from "@calca/shared/contracts";
import type { PipelineImagesRequest, PipelineImagesResponse } from "@calca/shared/contracts";

export class ImagesPipeline {
  constructor(private imageProvider: ImageProvider) {}

  async generate(request: PipelineImagesRequest): Promise<PipelineImagesResponse> {
    const images: Record<string, string> = {};

    for (const placeholder of request.placeholders) {
      const url = await this.imageProvider.generate(
        placeholder.prompt,
        getSizeFromHtml(request.html, placeholder.id),
        placeholder.preferredSource,
      );
      images[placeholder.id] = url;
    }

    // Replace placeholders in HTML
    let html = request.html;
    for (const [id, url] of Object.entries(images)) {
      html = html.replace(`<!--image:${id}-->`, `<img src="${url}" />`);
    }

    return { html, images };
  }
}
```

### 4. Review Stage

Visual QA and auto-fixes:

```typescript
// pipeline/review.ts
export class ReviewPipeline {
  constructor(private provider: LLMProvider) {}

  async review(request: PipelineReviewRequest): Promise<PipelineReviewResponse> {
    const prompt = buildReviewPrompt(request);
    const response = await this.provider.complete(prompt);
    return parseReviewResponse(response);
  }
}
```

### 5. Critique Stage

Generate improvement feedback:

```typescript
// pipeline/critique.ts
export class CritiquePipeline {
  constructor(private provider: LLMProvider) {}

  async critique(request: PipelineCritiqueRequest): Promise<PipelineCritiqueResponse> {
    const prompt = buildCritiquePrompt(request);
    const response = await this.provider.complete(prompt);
    return parseCritiqueResponse(response);
  }
}
```

---

## Provider Wrappers

### LLM Provider Interface

```typescript
// providers/llm-provider.ts
export interface LLMProvider {
  stream(prompt: string): AsyncGenerator<string>;
  complete(prompt: string): Promise<string>;
}
```

### Claude Provider

```typescript
// providers/claude-provider.ts
export class ClaudeProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async *stream(prompt: string): AsyncGenerator<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
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
    return fullResponse.join("");
  }
}
```

### Image Provider

```typescript
// providers/image-provider.ts
export interface ImageProvider {
  generate(
    prompt: string,
    size: { width: number; height: number },
    preferredSource?: string,
  ): Promise<string>;
}

// Multi-provider with fallback
export class MultiImageProvider implements ImageProvider {
  private providers: ImageProvider[] = [
    new UnsplashProvider(),
    new DallEProvider(),
    new GeminiProvider(),
  ];

  async generate(
    prompt: string,
    size: { width: number; height: number },
    preferredSource?: string,
  ): Promise<string> {
    const providerIndex = preferredSource
      ? this.providers.findIndex((p) =>
          p.constructor.name.toLowerCase().includes(preferredSource.toLowerCase()),
        )
      : 0;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[(providerIndex + i) % this.providers.length];
      try {
        return await provider.generate(prompt, size, preferredSource);
      } catch (error) {
        console.warn(`Provider ${provider.constructor.name} failed, trying next...`);
        continue;
      }
    }

    throw new Error("All image providers failed");
  }
}
```

---

## Prompt Templates

### Layout Prompt Builder

```typescript
// prompts/layout.ts
export function buildLayoutPrompt(
  prompt: string,
  conceptId: string,
  sizeHints: Record<string, { width: number; height: number }>,
  vibe: string,
  style: string,
  aesthetic: string,
): string {
  return `Create a ${aesthetic} design for: ${prompt}

Concept: ${conceptId}
Vibe: ${vibe}
Style: ${style}

${sizeHints ? `Size hints: ${JSON.stringify(sizeHints)}` : ""}

Requirements:
- Generate HTML/CSS with inline styles
- Use placeholder divs for images: <!--image: id:preferred-source-->
- Include size hints: <!--size: id:widthxheight-->
- Ensure responsive design
- Use modern CSS (flexbox, grid)
`;
}
```

### Design Presets

```typescript
// prompts/presets.ts
export type Preset = "ui-ux" | "marketing" | "brand";

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
  "ui-ux": {
    id: "ui-ux",
    name: "UI/UX Design",
    description: "Modern interfaces with attention to spacing, hierarchy, and micro-interactions",
    typography: {
      scale: ["12px", "14px", "16px", "20px", "24px", "32px", "48px"],
      headings: { weights: ["400", "500", "600", "700"], sizes: ["20px", "24px", "32px", "48px"] },
    },
    spacing: {
      unit: 4,
      multipliers: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
    },
    colors: {
      palette: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
      semantic: { primary: "#3b82f6", secondary: "#64748b", accent: "#f59e0b" },
    },
    antiPatterns: ["beveled edges", "gradients", "animations"],
    systemPrompt: `You are a UI/UX designer. Create clean, modern interfaces with proper spacing, typography hierarchy, and micro-interactions. Avoid beveled edges, excessive gradients, and animations.`,
  },
  marketing: {
    id: "marketing",
    name: "Marketing Website",
    description: "High-conversion landing pages with compelling visuals and clear calls-to-action",
    typography: {
      scale: ["14px", "16px", "20px", "28px", "36px", "48px", "64px"],
      headings: { weights: ["400", "500", "600", "700"], sizes: ["28px", "36px", "48px", "64px"] },
    },
    spacing: {
      unit: 8,
      multipliers: [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    colors: {
      palette: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
      semantic: { primary: "#3b82f6", secondary: "#10b981", accent: "#f59e0b" },
    },
    antiPatterns: ["small text", "distracting backgrounds", "cluttered layouts"],
    systemPrompt: `You are a marketing copywriter and designer. Create high-conversion landing pages with compelling visuals, clear calls-to-action, and compelling copy. Avoid small text, distracting backgrounds, and cluttered layouts.`,
  },
  brand: {
    id: "brand",
    name: "Brand/Ad Design",
    description: "Bold, minimal designs perfect for social ads and brand materials",
    typography: {
      scale: ["14px", "16px", "18px", "24px", "32px", "48px", "64px"],
      headings: { weights: ["400", "500", "600", "700"], sizes: ["24px", "32px", "48px", "64px"] },
    },
    spacing: {
      unit: 8,
      multipliers: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
    },
    colors: {
      palette: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
      semantic: { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#f59e0b" },
    },
    antiPatterns: ["traditional corporate design", "soft shadows", "minimal white space"],
    systemPrompt: `You are a brand designer. Create bold, minimal designs perfect for social ads and brand materials. Avoid traditional corporate design, soft shadows, and minimal white space.`,
  },
};
```

---

## HTML Parsers

### Extract Size Hints

```typescript
// parsers/layout.ts
export function extractSizeHints(html: string): Record<string, { width: number; height: number }> {
  const sizeHints: Record<string, { width: number; height: number }> = {};

  const regex = /<!--size:(.+?)-->/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [full, rest] = match;
    const parts = rest.split(":");
    const [id, size] = parts;
    const [width, height] = size.split("x").map(Number);

    sizeHints[id] = { width, height };
  }

  return sizeHints;
}
```

### Extract Image Placeholders

```typescript
export function extractImagePlaceholders(html: string): Array<{
  id: string;
  preferredSource?: string;
}> {
  const placeholders: Array<{ id: string; preferredSource?: string }> = [];

  const regex = /<!--image:\s*([^:]+)(?::([^\s]+))?\s*-->/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, id, source] = match;
    placeholders.push({
      id,
      preferredSource: source,
    });
  }

  return placeholders;
}
```

---

## Feature Registration

### Server Feature Base Class

```typescript
// features/server-feature.ts
export abstract class ServerFeature {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  // Called when feature is loaded
  async onActivate(): Promise<void> {}

  // Called when feature is deactivated
  async onDeactivate(): Promise<void> {}
}
```

### UI Feature Base Class

```typescript
// features/ui-feature.ts
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

---

## Testing

**Test pipeline stages:**

```typescript
// pipeline/layout.test.ts
import { describe, it, expect } from "vitest";
import { LayoutPipeline } from "./layout";

describe("LayoutPipeline", () => {
  it("generates HTML from prompt", async () => {
    const pipeline = new LayoutPipeline({
      provider: mockProvider,
      systemPrompt: PRESETS["ui-ux"].systemPrompt,
    });

    const result = await pipeline.generate({
      prompt: "A pricing card",
      conceptId: "1",
    });

    expect(result.html).toContain("<div");
    expect(result.sizeHints).toBeDefined();
  });
});
```

---

## Licensing Note

This package is AGPL-3.0 licensed. See root [AGENTS.md](../../AGENTS.md) for dual-license rules. Core packages must NEVER import from `packages/pro/`.

---

## Related Guides

- [packages/shared/AGENTS.md](../shared/AGENTS.md) — Type definitions
- [apps/web/AGENTS.md](../../apps/web/AGENTS.md) — Web usage
- [apps/server/AGENTS.md](../../apps/server/AGENTS.md) — API routes
