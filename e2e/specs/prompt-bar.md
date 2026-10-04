# Prompt Bar

## Submitting a prompt with Enter key

* Open "/"
* Fill "A modern pricing card with three tiers" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear

## Navigating prompt history with arrow keys

* Open "/"
* Seed prompt history with "Second prompt text" and "First prompt text"
* Reload the page
* Press the "ArrowUp" key
* The prompt field should contain "Second prompt text"
* Move the caret to the "start" of the prompt field
* Press the "ArrowUp" key
* The prompt field should contain "First prompt text"
* Move the caret to the "end" of the prompt field
* Press the "ArrowDown" key
* The prompt field should contain "Second prompt text"

## Toggling Build/Ideate mode

* Open "/"
* Click the "Build" button
* Page should contain "Ideate"
* Click the "Ideate" button
* Page should contain "Build"

## Selecting variations count

* Open "/"
* Click the "Variations" button
* Set the variations count to "3"
* Page should contain "3"

## Image attachment renders as a named pill

* Open "/"
* Seed an image attachment named "test-image.png"
* Reload the page
* Wait for "test-image.png" to appear

## Canceling generation

* Open "/"
* Clear the attachments
* Fill "A long generation prompt that will take time to process" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear
* Click the "Cancel (Esc)" button
* Wait for "Variations" to appear
