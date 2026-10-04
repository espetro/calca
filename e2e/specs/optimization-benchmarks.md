# Generation Pipeline

Tier-1: requires a working AI provider (paid or free-tier OpenRouter). Skip in
fast loops — run nightly or before releases.

## Repeated generation succeeds twice

* Open "/?quick=1"
* Fill "A pricing card with a buy button" in the "Prompt" field
* Press the "Enter" key
* Wait for node "Variation 1" to render
* Fill "A pricing card with a buy button" in the "Prompt" field
* Press the "Enter" key
* Wait for "2" rendered nodes

## Malformed prompt fails gracefully

* Open "/"
* Fill "a single unclosed tag or malformed CSS" in the "Prompt" field
* Press the "Enter" key
* Page should not contain "500 Internal Server Error"
* Page should not contain "Unexpected token"
