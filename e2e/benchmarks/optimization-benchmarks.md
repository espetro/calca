# Generation Pipeline Benchmarks

Tier-1: requires a working AI provider (paid or free-tier OpenRouter). These
scenarios measure wall-clock generation latency against a real model — they are
NOT deterministic and are excluded from the default `e2e/specs` suite. Run
nightly or before releases:

```bash
GAUGE_TS_PACKAGE_RUNNER=bun STEP_IMPL_DIR=steps,support \
  ./node_modules/.bin/gauge run e2e/benchmarks
```

## Repeated generation succeeds twice

* Open "/?quick=1"
* Fill "A pricing card with a buy button" in the "Prompt" field
* Press the "Enter" key
* Wait for node "Variation 1" to render
* Fill "A pricing card with a buy button" in the "Prompt" field
* Press the "Enter" key
* Wait for "2" rendered nodes
