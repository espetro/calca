# Long-Running SSE Stream Through the Service Worker

Tags: sw, benchmark

Guard for the worker idle-kill risk on multi-minute streams (issue #74): a
sequential-mode generation keeps `/api/workflow` SSE flowing for several
minutes. Excluded from the default suite — run explicitly in SW mode:

```bash
E2E_AI_BASE_URL=… E2E_AI_API_KEY=… E2E_AI_MODEL=… bun scripts/e2e-sw.ts e2e/benchmarks
```

(VITE_AI_* or CAUCE_AI_* env vars resolve the same way.)

## A sequential generation streams to completion without the worker idling out

* Open "/?quickMode=false"
* Seed provider credentials from the environment
* Fill "A complete landing page for a habit-tracker mobile app with a hero, feature grid, testimonials, and pricing" in the "Prompt" field
* Press the "Enter" key
* Wait up to "900" seconds for node "Variation 1" to render
