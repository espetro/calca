# Tier-0 Core Flows

The kill-criteria paths: if any of these break, the app is broken for every
user. Scenarios run in order and share the canvas state produced earlier.

## Cold open shows onboarding, dismiss leaves a usable prompt bar

* Reset the onboarding flag
* Open "/"
* Wait for "Welcome to Calca" to appear
* Click the "Skip for now" button
* Page should contain "Prompt"
* Page should contain "Build"

## Prompt to rendered frame, persisted across reload

* Open "/"
* Fill "A minimal hero section for a bakery" in the "Prompt" field
* Press the "Enter" key
* Wait for node "Variation 1" to render
* Reload the page
* Wait for node "Variation 1" to render

## Selecting a node shows the context toolbar

* Open "/"
* Select the first canvas node
* Page should contain "Remix"
* Page should contain "Export"

## Canvas node can be dragged

* Open "/"
* Drag the first canvas node
* The first canvas node should have moved
