# Product Requirements Document — Calca

## Vision

Calca is an AI-powered design tool that lets users describe what they want in natural language and receive multiple polished HTML/CSS design variations on an infinite canvas.

Users can sketch their ideas, trace reference images, and bring concepts to life through an intuitive interface that feels like having a designer friend looking over their shoulder — helpful, warm, and never in the way.

## Positioning Statement

Calca is the AI design tool for people who think in words, not pixels.

## Target Users

| Persona | Description | Primary Need |
| --- | --- | --- |
| **Frontend Developers** | Engineers who need UI mockups before coding | Rapid visual prototyping, component design exploration |
| **Product Managers** | Non-technical stakeholders defining product requirements | Visual communication of feature ideas, landing page concepts |
| **Marketers** | Teams creating social ads, banners, email headers | Quick marketing asset generation without design team dependency |
| **Startup Founders** | Solo entrepreneurs building MVPs | Affordable design iteration without hiring designers |
| **Design-curious Individuals** | Anyone exploring visual design ideas | Low-barrier entry to design creation via natural language |

## Brand Voice & Copy Narrative

### Voice Pillars

**Capable, not complicated** — Calca is powerful, but we never make the user feel small. Explain what something does in one line.

**Short, active sentences** — Subject-verb-object. No filler.

**Encouraging without being patronizing** — "Start sketching" beats "You're ready to get started!" every time.

**Confident but never bossy** — We make recommendations, not demands.

### Vocabulary Rules

| Use | Avoid |
|-----|-------|
| canvas, frame, layer, trace, sketch | workspace, interface, widget, tool |
| bring in, drop, place, adjust | import, upload, configure, configure settings |
| something went wrong | error, failed to, attempt, initialized |

### Copy by UI Surface

#### Onboarding

> **Welcome to Calca.**
> Start sketching, or bring in a design you'd like to trace over. No setup needed.

> *(Step 1 of 3)*
> **What are you designing?**
> A mobile app, a landing page, a pitch deck — Calca works for all of it.

> **You're all set.**
> Your canvas is blank and waiting. Grab a frame and start laying things down.

#### Empty States

| Context | Copy |
|---|---|
| No projects yet | **Nothing here yet.** Start a new project, or import something to trace over. |
| No plugins installed | **Your toolkit is empty.** Browse plugins to extend what Calca can do. |
| No themes applied | **Still wearing defaults.** Themes let you make the canvas feel like yours. |
| Empty search results | **No matches for "{{ query }}".** Try a different name, or start from scratch. |
| No activity / history | **No changes yet.** Once you start designing, your history lives here. |

#### Tooltips

| Element | Tooltip |
|---|---|
| New Frame | Start a new area to design in |
| Trace Layer | Place a reference image to draw on top of |
| Ghost Overlay | Toggle the transparency of your reference |
| Plugin panel | Extend Calca with community-built tools |
| Theme picker | Change how your canvas looks and feels |
| Export | Save your design as an image, SVG, or file |
| Zoom to fit | Bring the whole canvas back into view |

#### Errors & System States

| Situation | Copy |
|---|---|
| Save failed | **Couldn't save your work.** We'll keep trying — you can also save manually. |
| Plugin failed to load | **This plugin didn't load.** Try reinstalling, or report the issue. |
| Import failed | **We couldn't read that file.** Make sure it's a supported format and try again. |
| Offline | **You're offline.** Your local changes are safe — we'll sync when you're back. |
| Unexpected crash | **Something went wrong on our end.** Your last save is intact. Reload when ready. |

#### Loading & Progress States

- *"Loading your canvas…"*
- *"Fetching your plugins…"*
- *"Almost there…"*
- *"Syncing your changes…"*
- *"Tracing your import…"* ← (for image/design imports — brand moment)

#### CTAs & Buttons

| Context | Primary | Secondary |
|---|---|---|
| New project modal | **Create project** | Not now |
| Delete confirmation | **Delete** | Keep it |
| Install plugin | **Install** | View details |
| Unsaved changes | **Save and close** | Discard changes |
| Upgrade prompt | **Explore Pro** | Maybe later |

#### Settings & Labels

| ❌ Technical | ✅ Calca |
|---|---|
| Enable auto-save interval | Save automatically as you work |
| Rendering engine: GPU/CPU | Use GPU acceleration when available |
| Default artboard resolution | Canvas resolution for new projects |
| Plugin sandbox mode | Keep plugins from accessing your files |
| Snap to grid threshold | How close to snap when dragging |

### Voice in One Sentence

> Like a designer friend looking over your shoulder — helpful, warm, and never in the way.

## Key Features

- 🎨 **Canvas** — Infinite workspace with pan, zoom, and frame organization
- ✨ **AI Pipeline** — Transform natural language into design variations
- 🔄 **Iterative Refinement** — Each concept learns from the last through critique
- 🎭 **Multi-Model Support** — Combine layout and generation capabilities
- 📦 **Export Options** — Figma, Tailwind CSS, React components
- 💻 **Desktop Experience** — Native application with full feature parity