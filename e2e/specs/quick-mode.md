# Quick Mode

## Activate Quick Mode via URL parameter

* Open "/?quickMode=true"
* Quick mode should be "enabled"

## Quick Mode persists across reloads

* Open "/?quickMode=true"
* Quick mode should be "enabled"
* Reload the page
* Quick mode should be "enabled"

## Remix a generated node

* Open "/?quickMode=true"
* Dismiss the onboarding dialog
* Import "e2e/fixtures/pricing-card.design" as a design file
* Wait for node "Variation 1" to render
* The first canvas node should be in the viewport
* Select the first canvas node
* Click "Remix"
* Wait for "Custom" to appear
* Click "Custom"
* Page should contain "Remixing"
