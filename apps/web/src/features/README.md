# Feature-Sliced Design (FSD) Structure

This project uses [Feature-Sliced Design](https://feature-sliced.design/) to organize code by business domain.

## Layers

```
src/
├── app/              # TanStack Router pages & layouts (Vite)
├── widgets/          # Composite UI blocks composed from features
│   ├── toolbar/      #   Top toolbar
│   └── prompt-bar/   #   Bottom prompt input
├── features/         # Business logic organized by domain
│   ├── canvas/       #   Pan, zoom, drag, frame management
│   ├── design/       #   AI pipeline (plan → layout → images → review → critique)
│   ├── settings/     #   BYOK, model selection, preferences
│   ├── comments/     #   Figma-style comment pins & AI response threads
│   ├── export/       #   Export to Figma, Tailwind CSS, React components
│   └── onboarding/   #   Tutorial, walkthrough, first-run experience
├── shared/           # Code shared across features
│   ├── ai/           #   AI client stubs (empty, being removed)
│   ├── types/        #   Domain type definitions
│   ├── constants/    #   Application-wide constants
│   └── utils/        #   Pure utility functions
└── lib/              # Cross-cutting utilities (empty, being removed)
```

## Feature Slice Template

Each feature directory follows this internal structure:

```
features/{feature}/
├── index.ts      # Public API barrel export
├── ui/           # React components specific to this feature
├── hooks/        # Feature-specific React hooks
├── api/          # API route handlers & client functions
└── lib/          # Feature utilities & helpers
```

## Import Rules

- `app/` may import from `widgets/`, `features/`, `shared/`, `lib/`
- `widgets/` may import from `features/`, `shared/`
- `features/` may import from `shared/`
- `features/` must NOT import from other `features/` (use shared/ for cross-feature code)
- `shared/` must NOT import from any other layer


