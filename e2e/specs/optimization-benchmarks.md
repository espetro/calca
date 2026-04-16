# Optimization Benchmarks

## Prompt caching efficiency (repeated layout generation)

* Open "https://gosto.localhost"
* Page should contain "Gosto"
* Fill "A pricing card with a buy button" in the prompt field
* Click the "Generate" button
* Wait for "Frame 1" to appear
* Page should contain "Frame 1"
* Fill "A pricing card with a buy button" in the prompt field
* Click the "Generate" button
* Wait for "Frame 1" to appear
* Page should contain "Frame 1"

## Parallel image generation (batch processing)

* Open "https://gosto.localhost"
* Page should contain "Gosto"
* Fill "A landing page with a hero section, pricing cards, and feature grid" in the prompt field
* Click the "Generate" button
* Wait for "Frame 1" to appear
* Click "Frame 1"
* Page should contain "Concept 1"
* Page should contain "hero"
* Page should contain "pricing"
* Page should contain "features"

## Tailwind-first visual generation

* Open "https://gosto.localhost"
* Page should contain "Gosto"
* Fill "A clean blog post card with a title, excerpt, and read more button" in the prompt field
* Click the "Generate" button
* Wait for "Frame 1" to appear
* Click "Frame 1"
* Page should contain "Concept 1"
* Page should contain "flex"

## Zod validation with graceful error handling

* Open "https://gosto.localhost"
* Page should contain "Gosto"
* Fill "a single unclosed tag or malformed CSS" in the prompt field
* Click the "Generate" button
* Page should not contain "500 Internal Server Error"
* Page should not contain "Unexpected token"
