# Prompt Bar

## Submitting a prompt with Enter key

* Open "https://calca.localhost"
* Page should contain "Describe a design..."
* Fill "A modern pricing card with three tiers: Starter, Pro, and Enterprise" in the Prompt field
* Press the "Enter" key
* Wait for "Generating..." to appear

## Navigating prompt history with arrow keys

* Open "https://calca.localhost"
* Fill "First prompt text" in the Prompt field
* Press the "Enter" key
* Wait for "Generating..." to appear
* Wait for "Describe a design..." to appear
* Fill "Second prompt text" in the Prompt field
* Press the "Enter" key
* Wait for "Generating..." to appear
* Wait for "Describe a design..." to appear
* Fill "Third prompt text" in the Prompt field
* Press the "Enter" key
* Wait for "Generating..." to appear
* Wait for "Describe a design..." to appear
* Press the "ArrowUp" key
* Page should contain "Third prompt text"
* Press the "ArrowDown" key
* Page should contain "Second prompt text"

## Toggling Build/Ideate mode

* Open "https://calca.localhost"
* Page should contain "Describe a design..."
* Click the Build button
* Page should contain "Ideate"
* Click the Ideate button
* Page should contain "Build"

## Selecting variations count

* Open "https://calca.localhost"
* Click the Variations button
* Click the variations option 3
* Page should contain "3"

## Toggling critique mode

* Open "https://calca.localhost"
* Page should contain "Describe a design..."
* Click the Critique mode button
* Page should contain "Critique"
* Click the Critique mode button
* Page should contain "Critique"

## Uploading and removing an image

* Open "https://calca.localhost"
* Click the Add image button
* Fill "e2e/fixtures/test-image.png" in the Add image field
* Wait for "test-image" to appear
* Click the Remove image button
* Page should not contain "test-image"

## Canceling generation with Escape key

* Open "https://calca.localhost"
* Fill "A long generation prompt that will take time to process" in the Prompt field
* Press the "Enter" key
* Wait for "Generating..." to appear
* Press the "Escape" key
* Page should not contain "Generating..."
