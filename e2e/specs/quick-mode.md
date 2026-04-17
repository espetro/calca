# Quick Mode

## Activate Quick Mode via URL parameter
* Open "https://gosto.localhost?quickMode=true"
* Page should contain "Quick Mode"

## Generate design in Quick Mode
* Open "https://gosto.localhost?quickMode=true"
* Fill "Describe your design" in the prompt field
* Click the "Generate" button
* Wait for "Generating" to appear
* Wait for "Frame" to appear
* Page should contain "Generate"
* Page should not contain "Review"

## Reload page without query parameter resets Quick Mode
* Open "https://gosto.localhost"
* Page should contain "Quick Mode"

## Comment-based revision uses full pipeline
* Open "https://gosto.localhost?quickMode=true"
* Fill "Describe your design" in the prompt field
* Click the "Generate" button
* Wait for "Frame" to appear
* Wait for "Generating" to appear
* Wait for "Review" to appear
* Click "comment pin"
* Fill "Refine this design" in the comment field
* Click the "Send" button
* Wait for "Critique" to appear
* Page should contain "Critique"
