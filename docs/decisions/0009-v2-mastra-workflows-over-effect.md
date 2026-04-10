# MADR: Why Mastra Workflows Are Over-Effect for Gosto v2

**Document ID**: 0009-v2-mastra-workflows-over-effect
**Status**: Accepted
**Date**: 2026-04-05
**Decision**: Skip Mastra AI framework, use direct SDK calls with extracted shared package

---

## 1. Background

The original Gosto codebase (Otto Canvas) uses a 4-stage AI pipeline:
1. **Layout** — Claude generates HTML/CSS with size hints and image placeholders
2. **Images** — Gemini/DALL-E/Unsplash fills placeholder divs with real images
3. **Review** — Claude performs visual QA and auto-fixes issues
4. **Critique** — Claude generates improvement feedback for the next variation

During the POC monorepo migration attempt, Mastra AI framework was considered as an abstraction layer for orchestrating these pipeline stages. The POC documentation (docs/prd-poc.md) describes Mastra as a framework for LLM agents with built-in tools, memory, and workflows.

---

## 2. Decision Statement

**We will NOT use Mastra AI framework in Gosto v2.** Instead, we will:

1. **Keep direct SDK calls** to Anthropic and Google for layout and image generation
2. **Extract pipeline logic** to a shared package (`packages/core`) with composable functions
3. **Define a simple LLMProvider interface** for SDK abstraction
4. **Implement structured error handling** and retry logic in the shared package

---

## 3. Context and Problem

### 3.1 What Mastra Promises

Mastra is an AI framework that aims to:

- **Abstract LLM interactions** — Manage prompts, parameters, and streaming in one place
- **Orchestrate workflows** — Chain multiple AI calls with tool definitions
- **Add memory** — Store conversation history and context across calls
- **Provide tool integration** — Built-in tools for RAG, databases, and external APIs
- **Handle errors** — Graceful fallbacks, retries, and error recovery

### 3.2 Why It Was Considered

The monorepo migration POC attempted to use Mastra for two reasons:

1. **Architectural ambition** — Demonstrated ability to build a robust AI system with clear boundaries
2. **Future scalability** — Mastra might help if we need more complex AI features later (multi-agent systems, RAG)

### 3.3 Why It's Overkill

After analyzing the current pipeline and POC learnings, we determined Mastra adds **no value** for Gosto v2:

| Aspect | Mastra | Direct SDK Calls | Impact on Gosto |
|--------|--------|------------------|-----------------|
| **Pipeline structure** | Agent workflow with tools | Sequential function calls | Pipeline is linear, no branching |
| **State management** | Mastra internal state | Shared package functions | State lives in UI, not AI layer |
| **LLM interactions** | Mastra wrapper + provider abstraction | Direct SDK calls | SDK wrappers provide same abstraction |
| **Image generation** | Mastra doesn't handle images | Gemini/Unsplash SDK | Pipeline includes non-LLM steps |
| **Streaming** | Mastra streaming support | Direct SDK streaming | Current implementation works well |
| **Error handling** | Mastra error handling | Custom error types | Can implement without framework |
| **Testing** | Mastra test utils | Pure TypeScript tests | Easier to test plain functions |
| **Dependency overhead** | 500+ KB framework bundle | SDKs only (~200 KB total) | Smaller bundle size |
| **Learning curve** | Complex framework concepts | Simple TypeScript | Faster onboarding |

---

## 4. Options Considered

### Option 1: Use Mastra AI Framework

**Pros**:
- Professional-grade AI orchestration
- Built-in tools and memory
- Future-proof for complex AI workflows
- Good documentation and community

**Cons**:
- **Over-abstraction** — Pipeline is 4 sequential steps, not a complex agent system
- **Non-LLM steps** — Mastra doesn't handle image generation (Gemini/Unsplash) or HTML parsing
- **Bundle size** — 500+ KB framework vs ~200 KB for direct SDKs
- **Testing complexity** — Mastra agents are harder to test than plain functions
- **No benefit for MVP** — Current direct SDK calls work perfectly

**Verdict**: **REJECTED**

---

### Option 2: Direct SDK Calls with Shared Package

**Pros**:
- **Simplicity** — Plain TypeScript functions, easy to understand
- **Performance** — Smaller bundle size, no framework overhead
- **Testability** — Pure functions are trivial to test with Vitest
- **Control** — Full control over error handling, retry logic, and prompts
- **Type safety** — Strong TypeScript types, no framework abstractions
- **Immediate benefit** — Current implementation works, just needs extraction

**Cons**:
- **Less abstraction** — No built-in workflow orchestration (we don't need it)
- **Manual error handling** — Must implement retry logic ourselves (easy, just code)
- **Learning curve** — No framework documentation to read (but we're building the logic)
- **Future flexibility** — Harder to switch to an agent framework later (but we can extract later)

**Verdict**: **SELECTED**

---

### Option 3: Hybrid Approach (Mastra + Direct Calls)

**Pros**:
- Use Mastra for LLM orchestration
- Use direct SDK calls for images and HTML parsing

**Cons**:
- **Complexity** — Two different AI strategies in one codebase
- **Maintenance burden** — Learn and maintain two frameworks
- **No clear winner** — Mastra doesn't do anything we can't do ourselves
- **Testing complexity** — Test both Mastra and direct calls

**Verdict**: **REJECTED** (add complexity without benefit)

---

## 5. Technical Design

### 5.1 Direct SDK Implementation

```typescript
// packages/core/src/providers/llm-provider.ts
import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@anthropic-ai/sdk/src/resources/messages';

export interface LLMProvider {
  streamMessages(messages: Message[]): AsyncIterable<string>;
  complete(messages: Message[]): Promise<string>;
}

export class AnthropicProvider implements LLMProvider {
  constructor(private apiKey: string) {}

  async *streamMessages(messages: Message[]): AsyncIterable<string> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const stream = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  async complete(messages: Message[]): Promise<string> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      messages,
      stream: false,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
```

### 5.2 Pipeline Orchestration

```typescript
// packages/core/src/pipeline/layout.ts
import type { LLMProvider } from '../providers/llm-provider.ts';

export class LayoutPipeline {
  constructor(private provider: LLMProvider) {}

  async generate(prompt: string): Promise<string> {
    const messages: Message[] = [
      { role: 'user', content: this.buildPrompt(prompt) },
    ];

    let response = '';
    for await (const chunk of this.provider.streamMessages(messages)) {
      response += chunk;
    }

    return response;
  }

  private buildPrompt(prompt: string): string {
    return `Create a design for: ${prompt}

Generate HTML/CSS with inline styles. Use placeholder divs for images: <!--image: id:preferred-source-->`;
  }
}
```

### 5.3 Error Handling

```typescript
// packages/core/src/errors.ts
export class RateLimitError extends Error {
  type = 'rate_limit';
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends Error {
  type = 'timeout';
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthError extends Error {
  type = 'auth';

  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### 5.4 Retry Logic

```typescript
// packages/core/src/utils/retry.ts
import type { ApiError } from '../errors.ts';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-transient errors
      if (error instanceof AuthError) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
```

---

## 6. Implementation Plan

### Phase 1: Create Shared Package Structure (Week 1)
1. Create `packages/core` directory
2. Define `LLMProvider` interface
3. Create AnthropicProvider and GeminiProvider implementations
4. Define error types (AuthError, RateLimitError, TimeoutError)
5. Add tests for providers

### Phase 2: Extract Pipeline Logic (Week 2)
1. Move layout generation logic to `packages/core/src/pipeline/layout.ts`
2. Move image generation logic to `packages/core/src/pipeline/images.ts`
3. Move review logic to `packages/core/src/pipeline/review.ts`
4. Move critique logic to `packages/core/src/pipeline/critique.ts`
5. Add tests for each pipeline stage

### Phase 3: Add Error Handling (Week 3)
1. Implement retry logic with exponential backoff
2. Add health checking for AI providers
3. Create error categorization utilities
4. Add error boundary UI components
5. Test error handling with mock failures

### Phase 4: Update API Routes (Week 4)
1. Refactor all API routes to use shared package
2. Remove direct SDK calls from API routes
3. Replace with provider wrappers
4. Test end-to-end generation flow
5. Verify no regressions

---

## 7. Success Criteria

The decision is successful when:

1. **All pipeline stages work** with direct SDK calls
2. **Error handling is robust** with proper retry logic
3. **Tests pass** for all shared package functions
4. **Bundle size is smaller** than Mastra-based approach
5. **No regressions** in generation quality or performance
6. **Code is simpler** and easier to understand

---

## 8. Alternatives Considered

### Alternative 1: Agent Workflow Framework (e.g., LangGraph)

**Pros**: Professional agent orchestration
**Cons**: Overkill, 4-stage pipeline is too simple for agents, large bundle size
**Verdict**: REJECTED

### Alternative 2: Custom Workflow Engine

**Pros**: Full control, minimal dependencies
**Cons**: Reimplement framework features we don't need, more code to write
**Verdict**: SKIP (direct SDK calls are simpler)

### Alternative 3: Hybrid (Mastra for LLMs + Custom for Images)

**Pros**: Use Mastra for LLMs, custom for images
**Cons**: Two different strategies, maintenance burden, no clear winner
**Verdict**: REJECTED (add complexity without benefit)

---

## 9. Open Questions

1. **Future-proofing** — Should we plan to migrate to an agent framework later?
   - **Answer**: Yes, but defer to P1. If needed, extract pipeline logic and swap providers.

2. **Multi-agent systems** — Could we use agents for future features?
   - **Answer**: Possible, but not needed for MVP. Keep simple for now.

3. **Tool integration** — Could Mastra's tool system help with image generation?
   - **Answer**: No, image generation requires SDK calls, not tools. Keep direct SDKs.

---

## 10. References

- **POC PRD**: `docs/prd-poc.md` — Describes Mastra attempt and why it wasn't completed
- **POC Learnings**: `docs/poc-learnings.md` — Verdict: SKIP Mastra, CARRY direct SDK calls
- **OpenSpec**: `.opencode/skills/` — Change management workflow
- **Related MADRs**: `docs/decisions/0001-0008.md` — Previous technology decisions

---

## 11. Risks and Mitigations

### Risk 1: Direct SDK calls are harder to maintain
**Mitigation**: Shared package with clear interfaces and tests makes maintenance easy.

### Risk 2: Need for agent features in future
**Mitigation**: Extract pipeline logic now, providers are independent, can swap providers later.

### Risk 3: Error handling complexity
**Mitigation**: Implement structured error types and retry logic upfront.

---

## 12. Conclusion

Mastra AI framework is **over-effect** for Gosto v2 because:

1. **Pipeline is simple** — 4 sequential steps, no branching or complex decision making
2. **Non-LLM steps** — Images and HTML parsing can't use Mastra
3. **No real benefit** — Direct SDK calls are simpler and faster
4. **Future-proofing** — Can extract providers later if needed

We will **skip Mastra** and use direct SDK calls with a shared package for better performance, simplicity, and testability.

---

*Document Version*: 1.0
*Last Updated*: 2026-04-05
*Author*: Sisyphus Project Management
*Related*: MADR 0001-0008
