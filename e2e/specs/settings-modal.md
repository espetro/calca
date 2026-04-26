# Settings Modal Interactions

## User can open settings modal from toolbar menu
* Open "https://calca.localhost"
* Wait for page to load completely
* Click the gear icon in the toolbar
* Page should contain "Settings"

## User can change the Build model
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Click the "Build Model" dropdown
* Select "Claude Opus 4.6" from the options
* Page should contain "Claude Opus 4.6"

## User can change the Ideate model
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Click the "Ideate Model" dropdown
* Select "Claude Sonnet 4.5" from the options
* Page should contain "Claude Sonnet 4.5"

## User can view the env provider (read-only, non-removable)
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Page should contain "Configure Providers" header
* Page should contain "Env" badge with teal color
* Page should contain a lock icon
* Page should contain "From environment" subtitle
* The "Env" provider card should NOT have a Remove button

## User can add a custom provider
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Click the "Add Provider" button
* Fill "Anthropic" in the provider name field
* Select "Anthropic" from the provider type dropdown
* Fill "https://api.anthropic.com/v1" in the base URL field
* Fill a test API key in the API key field
* Click the "Test" button
* Page should contain "Connection successful" or similar success message
* Click the "Save" button
* Page should contain "Anthropic" in the provider list

## User can test a provider connection
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Click the "Add Provider" button
* Fill "Test Provider" in the provider name field
* Select "OpenAI-Compatible" from the provider type dropdown
* Fill "http://localhost:1234/v1" in the base URL field
* Fill a test API key in the API key field
* Click the "Test" button
* Wait up to 5 seconds for connection attempt
* Page should contain success message or detailed connection error

## User can remove a custom provider
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Find a custom provider in the provider list (not "Env")
* Click the "Remove" button on the custom provider card
* Confirm the removal in the dialog
* The provider should be removed from the list
* Click outside the modal or press Escape to close it

## User can save image keys (Gemini, DALL-E, Unsplash)
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Scroll to the "Image Sources" section
* Fill "test-gemini-key" in the Gemini API key field
* Fill "test-dalle-key" in the DALL-E API key field
* Fill "test-unsplash-key" in the Unsplash API key field
* Click outside the modal or press Escape to close it without saving
* Click the gear icon again to re-open settings
* The API key fields should be empty (no persistence)

## User can navigate settings modal sections
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Page should contain "Models" section with Build and Ideate model selectors
* Page should contain "Configure Providers" section with provider list
* Page should contain "Image Sources" section with Gemini, DALL-E, and Unsplash fields
* Page should contain "Experimental" section with generation mode, concept count, presets, and system prompt

## User can close settings modal without saving changes
* Open "https://calca.localhost"
* Click the gear icon in the toolbar
* Change the Build model from "Claude Opus 4.6" to "Claude Sonnet 4.5"
* Click outside the modal or press Escape to close it
* Click the gear icon again to re-open settings
* The Build model should still be "Claude Opus 4.6" (changes not persisted)
