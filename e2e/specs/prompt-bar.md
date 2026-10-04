# Prompt Bar

## Submitting a prompt with Enter key

* Open "/"
* Fill "A modern pricing card with three tiers" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear

## Navigating prompt history with arrow keys

* Open "/"
* Fill "First prompt text" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear
* Fill "Second prompt text" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear
* Press the "ArrowUp" key
* The prompt field should contain "Second prompt text"
* Press the "ArrowDown" key
* The prompt field should be empty

## Toggling Build/Ideate mode

* Open "/"
* Click the "Build" button
* Page should contain "Ideate"
* Click the "Ideate" button
* Page should contain "Build"

## Selecting variations count

* Open "/"
* Click the "Variations" button
* Click the variations option "3"
* Page should contain "3"

## Uploading an image attachment

* Open "/"
* Upload "e2e/fixtures/test-image.png" to the media picker
* Wait up to "2" seconds
* Page should contain "test-image"

## Canceling generation with Escape key

* Open "/"
* Fill "A long generation prompt that will take time to process" in the "Prompt" field
* Press the "Enter" key
* Wait for "Generating" to appear
* Press the "Escape" key
* Page should not contain "Generating…"
